use anchor_lang::{prelude::*, system_program::{Transfer, transfer}};
use anchor_spl::{
    token_interface::{TransferChecked, transfer_checked, MintTo, mint_to},
    metadata::{CreateMasterEditionV3, CreateMetadataAccountsV3, UpdateMetadataAccountsV2,
         create_master_edition_v3, create_metadata_accounts_v3, update_metadata_accounts_v2}
    };


use crate::states::{constants::*, contexts::*, errors::*, DonationsMade, SplDonations};




pub fn donate_funds_to_patient_escrow(ctx: Context<Donation>, case_id: String, donation_token: Pubkey, amount_to_donate: u64, nft_uri: String) -> Result<()> {
    
    // Let's Get the Patient Escrow PDA, Patient Case and Donor PDAs
    let patient_case = &mut ctx.accounts.patient_case;
    let patient_escrow = &mut ctx.accounts.patient_escrow;
    let donor_info = &mut ctx.accounts.donor_account;

    // Check to ensure if case is verified or not.
    require!(patient_case.is_verified == true, CuraChainError::UnverifiedCase);

    let donor = &ctx.accounts.donor;


    // We Need To Prevent Overfunding of a case
    require!(patient_case.case_funded == false, CuraChainError::CaseFullyFunded);

    require!(patient_escrow.try_lamports()? >= 890880, CuraChainError::EscrowNotExist);

    // We have already checked for valid case_id. Ensure non-zero amount
    require!(amount_to_donate > 0, CuraChainError::NonZeroAmount);

    // ------------------------           MATCH DONATION TOKEN TYPE, AND SET UP RELEVANT CPIs     ----------------------//

    match donation_token {

        NATIVE_SOL_MINT_ADDRESS => {
            // For SOL Donation,  perform actual transfer from donor to patient_escrow via CPI
            let cpi_program = ctx.accounts.system_program.to_account_info();

            let cpi_accounts = Transfer {
                from: donor.to_account_info(),
                to: patient_escrow.to_account_info(),
            };

            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

            transfer(cpi_ctx, amount_to_donate)?;

            // Let's Update the patient-case with these infos
            patient_case.total_sol_raised = patient_case.total_sol_raised.checked_add(amount_to_donate).ok_or(CuraChainError::OverflowError)?;
            },
    
            _ => {
                // For SPL Token, perform Transfer From Donor's ATA to Patient Token Vault via CPI
                let cpi_program = ctx.accounts.token_program.to_account_info();

                let cpi_accounts = TransferChecked {
                    from: ctx.accounts.donor_ata.to_account_info(),
                    mint: ctx.accounts.donation_token.to_account_info(),
                    to: ctx.accounts.patient_token_vault.to_account_info(),
                    authority: ctx.accounts.donor.to_account_info()
                };

                let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

                transfer_checked(cpi_ctx, amount_to_donate, ctx.accounts.donation_token.decimals)?;

                // Let's update or insert the spl donations mint and amount
                let mut found = false;
                for entry in patient_case.spl_donations.iter_mut() {
                    if entry.mint == donation_token {
                        entry.total_mint_amount = entry.total_mint_amount
                            .checked_add(amount_to_donate)
                            .ok_or(CuraChainError::OverflowError)?;
                        found = true;
                        break;
                    }
                }
                // For A new Token
                if !found {
                    patient_case.spl_donations.push(SplDonations{
                        mint: donation_token,
                        total_mint_amount: amount_to_donate
                    });
                }
            }
    }

    //    ---------------------  NFT MINTING LOGIC AND METADATA UPDATES    ------------------------------- //
    // Let's Have The Logic To Mint The Recognition NFT to donor For First Time Case Donation
    let case_id_bytes = {
        let bytes = case_id.as_bytes();
        let mut arr = [0u8;8];
        arr.copy_from_slice(bytes);
        arr
    };
    let first_time_donation = !donor_info.donated_cases.contains(&case_id_bytes);

    // If First Time Case Donation, Mint Recognition NFT
    if first_time_donation {
        donor_info.donated_cases.push(case_id_bytes);
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let seeds = &[
            b"multisig",
            b"escrow-authority".as_ref(),
            &[ctx.accounts.multisig.multisig_bump]
        ];
        let multisig_seeds = &[&seeds[..]];

        let accounts = MintTo {
            mint: ctx.accounts.donor_nft_mint.to_account_info(),
            to: ctx.accounts.donor_nft_account.to_account_info(),
            authority: ctx.accounts.multisig.to_account_info()
        };

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, accounts, multisig_seeds);
        mint_to(cpi_ctx, 1)?;

        // Create Metadata Account For First-time Donations
        let cpi_program = ctx.accounts.metadata_program.to_account_info();
        let cpi_accounts = CreateMetadataAccountsV3 {
            metadata: todo!(),
            mint: todo!(),
            mint_authority: todo!(),
            payer: todo!(),
            update_authority: todo!(),
            system_program: todo!(),
            rent: todo!(),
        };
    }

    // If Case Has Reached Full Funding, Let's Reset The CaseFunded to true, to prevent further funds
    // We intend to allow a buffer of 0.001 SOL on all fundings
    let mut grand_donations = patient_case.total_sol_raised;
    for each_spl in patient_case.spl_donations.iter() {
        grand_donations = grand_donations
            .checked_add(each_spl.total_mint_amount)
            .ok_or(CuraChainError::OverflowError)?;
    }
    if grand_donations >= patient_case.total_amount_needed + 1000000 {
        patient_case.case_funded = true;
    }

    // DONOR INFO UPDATE
    // Let's update Donor Account
    donor_info.donor_address = donor.key();
    donor_info.donor_bump = ctx.bumps.donor_account;
    donor_info.total_donations = donor_info.total_donations.checked_add(amount_to_donate).ok_or(CuraChainError::OverflowError)?;

    // CATCHING THIS EVENT ON-CHAIN ANYTIME A DONATION IS MADE TO ANY CASE ID
    let message = format!("A Donor of address {} has contributed an amount of {} to patient case of ID {}", donor.key(), amount_to_donate, case_id);
    let current_time = Clock::get()?.unix_timestamp;

    emit!(DonationsMade {
        message,
        donor_address: donor.key(),
        donated_amount: amount_to_donate,
        case_id: case_id,
        timestamp: current_time
    });

    Ok(())
}