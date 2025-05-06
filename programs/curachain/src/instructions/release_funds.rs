use anchor_lang::{prelude::*, solana_program::{self, rent::Rent}};
use anchor_spl::{associated_token::{create_idempotent, AssociatedToken, get_associated_token_address, Create, ID},
    token_interface::{transfer_checked, TransferChecked}};

use crate::states::{contexts::*, errors::*, ReleaseOfFunds};

pub fn release_funds(ctx: Context<ReleaseFunds>, case_id: String, proposal_index: u64) -> Result<()> {
    // Let's get the necessary accounts
    let patient_escrow = &mut ctx.accounts.patient_escrow;
    let patient_case = &mut ctx.accounts.patient_case;

    let treatment_address = &mut ctx.accounts.facility_address;
    let case_lookup = &ctx.accounts.case_lookup;
    let remaining_accounts = &ctx.remaining_accounts;
    let proposal = &ctx.accounts.proposal;

    // ENSURE PROPOSAL IS APPROVED
    require!(proposal.approved == true, CuraChainError::ProposalNotApproved);
    require!(proposal.case_id == case_id, CuraChainError::NoProposalMade);
    require!(proposal.proposal_index == proposal_index, CuraChainError::InvalidProposalIndex);


    // We Get The Escrow Balance Including Rent-exempt
    let total_escrow_balance = patient_escrow.lamports();
    let rent = Rent::get()?;
    let rent_lamports = rent.minimum_balance(0);

    let actual_escrow_balance;
    let mut close_account = false;

    // @dev If Case is fully funded, we'll transfer everythin including rent-exempt, 
    // Otherwise, we will transfer everythin excluding rent-exempt
    if patient_case.case_funded == true {
        // transfer entire balance, and close account
        actual_escrow_balance = total_escrow_balance;
        // set close_account to true
        close_account = true;
    } else {
        // Get Actual Escrow balance excluding Rent-exempt
    // @dev This is to ensure the patient escrow account can continue to receive donations
        actual_escrow_balance = total_escrow_balance.checked_sub(rent_lamports).ok_or(CuraChainError::UnderflowError)?;
    }
    

    require!(actual_escrow_balance > 0, CuraChainError::NonZeroAmount);

   
    //  ...............          SET UP FOR SOL TRANSFER VIA LOW-LEVEL SOLANA CALL         .............   //
    // ----------  ONLY TRANSFER IF THERE WAS A SOL DONATION  ---------------- //

    if patient_case.total_sol_raised > 0 {

        let patient_case_key = &patient_case.key();
 
        let seeds = &[
            b"patient_escrow",
            case_id.as_bytes().as_ref(),
            patient_case_key.as_ref(),
            &[case_lookup.patient_escrow_bump]
        ];

        let signer_seeds = &[&seeds[..]];
 
        let transfer_ix = solana_program::system_instruction::transfer(
            &patient_escrow.key(),
            &treatment_address.key(),
            actual_escrow_balance
        );
 
        solana_program::program::invoke_signed(
            &transfer_ix,
            &[
                patient_escrow.clone(),
                treatment_address.clone(),
                ctx.accounts.system_program.to_account_info()
            ],
            signer_seeds
        )?;

    }

    // ------- SPL TOKENS TRANSFER TO TREATMENT FACILITY ATA IF THERE WERE SPL DONATIONS MADE  ------- //
    if patient_case.spl_donations.len() > 0 {

        // Iterate Through The Spl Donations, And For Each, Create A Facility ATA if it doesn't exist, and
        // Transfer The Donated Tokens To The Facility ATA
        for spl_donation in patient_case.spl_donations.iter_mut() {
            // 1. Get Patient Token Vault That Holds The Donated Tokens
            // 2. Create Facility ATA for That Token If It Doesn't Exist
            // 3. Initiate The Transfer From The Patient Token Vault to Facility ATA
            let (patient_token_vault, _vault_bump) = Pubkey::find_program_address(
                &[
                    b"patient_token_vault",
                    case_id.as_bytes().as_ref(),
                    patient_escrow.key().as_ref(),
                    spl_donation.mint.as_ref()
                ],
                ctx.program_id
            );

            // For No Explicit Check, We use the `create_indempotent` function which creates the ATA if 
            // it doesn't exist, and does nothing if it exists, just like the init_if_needed
            let facility_ata = get_associated_token_address(
                &treatment_address.key(),
                &spl_donation.mint
            );
            /* 
            let required_accounts = Create {
                payer: ctx.accounts.transfer_authority.to_account_info(),
                associated_token: AccountInfo::new(),
                authority: treatment_address.to_account_info(),
                mint: spl_donation.mint.to_account_info,
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info()
            };*/
        }
    }

    // Only Check Remaining Balance When We Are Not Closing Account
    if !close_account {
        // CHECK: To ensure there is still rent-exempt for the Escrow As Long As Total Amount Has Not Been Raised
    let final_balance_transfer = patient_escrow.lamports();
    require!(final_balance_transfer >= rent_lamports, 
        CuraChainError::InsufficientRentBalance);
    }
    

    // Update Patient Case With This Transferred Amount
    patient_case.total_sol_raised = patient_case.total_sol_raised
        .checked_sub(actual_escrow_balance).ok_or(CuraChainError::UnderflowError)?;

    // For total_amount_needed, only subtract the minimum of (actual_escrow_balance, total_amount_needed) to
    // prevent underflow
    let amount_to_subtract = std::cmp::min(actual_escrow_balance, patient_case.total_amount_needed);
    patient_case.total_amount_needed = patient_case.total_amount_needed
        .checked_sub(amount_to_subtract).ok_or(CuraChainError::UnderflowError)?;

    // Reset case funded flag if there is still more needed after partial release of funds
    if patient_case.total_amount_needed > 0 {
        patient_case.case_funded = false;
    }

    // Close account if fully funded
    if close_account {
        // Transfer all remaining lamports, and mark account for closure
        // NB: 
        **patient_escrow.try_borrow_mut_lamports()? = 0;
        **treatment_address.try_borrow_mut_lamports()? = treatment_address
            .lamports()
            .checked_add(patient_escrow.lamports())
            .ok_or(CuraChainError::OverflowError)?;
    }


    // EMIT AN EVENT FOR THIS INSTRUCTION ON-CHAIN ANYTIME THERE IS A RELEASE OF FUNDS
    let current_time = Clock::get()?.unix_timestamp;
    let message = format!("Contributed Funds of amount {} has been released for patient case ID ,{} at time of ,{}",
         actual_escrow_balance, case_id, current_time);

    emit!(
        ReleaseOfFunds{
            message,
            treatment_address: treatment_address.key(),
            transferred_amount: actual_escrow_balance,
            case_id: case_id,
            timestamp: current_time
        }
    );


    Ok(())
}
