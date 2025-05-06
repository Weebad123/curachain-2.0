use anchor_lang::prelude::*;

pub mod instructions;
pub mod states;

use instructions::*;
use states::*;

declare_id!("4t7Agar7zuPB4o6mit6jijt6RMuRdKtqE8FYRybApbBj");

#[program]
pub mod curachain {
    use super::*;

    pub fn initialize_administrator(ctx: Context<AdminConfig>, admin_address: Pubkey) -> Result<()> {

        initialize_admin(ctx, admin_address)?;
        Ok(())
    }


    // Initialize The Global Verifiers Registry List, Multisig And Case Counter
    pub fn initialize_global_verifiers_list_and_case_counter(ctx: Context<InitializeVerifiersRegistryMultisigAndCaseCounter>) -> Result<()> {

        instructions::verifiers_operations::initialize_verifiers_list(ctx)?;

        Ok(())
    }

    
    pub fn add_or_remove_verifier(ctx: Context<VerifierInfo>, verifier: Pubkey, operation_type: VerifierOperationType) -> Result<()> {

        match operation_type {
            VerifierOperationType::Add => {
                instructions::verifiers_operations::add_verifier(ctx, verifier)?;
            },

            VerifierOperationType::Remove => {
                instructions::verifiers_operations::remove_verifier(ctx, verifier)?;
            }
        }
        Ok(())
    }


    // Update Multisig Here
    pub fn update_multisig(ctx: Context<AddorRemoveMultisigMember>, member_addresses: Vec<Pubkey>, multisig_op_type: MultisigOperationType) -> Result<()> {

        instructions::multisig_operations::add_or_remove_members(ctx, member_addresses, multisig_op_type)?;
        Ok(())
    }

    // Patient Submit Cases Here
    pub fn submit_cases(ctx: Context<InitializePatientCase>, case_description: String, total_amount_needed: u64, 
        link_to_records: String) -> Result<()> {

        instructions::initialize_patient(ctx, case_description, total_amount_needed, link_to_records)?;
        Ok(())
    }

    // A View Instruction To Get All Necessary Details About A Case
    pub fn view_case_details(ctx: Context<PatientDetails>, case_id: String) -> Result<()> {

        instructions::view_patient_case(ctx, case_id)?;

        Ok(())
    }

    // Verifier attempts to approve a patient case
    pub fn verify_patient(ctx: Context<VerifyPatientCase>, case_id: String, is_yes: bool) -> Result<()> {

        instructions::approve_patient_case(ctx, case_id, is_yes)?;

        Ok(())
    }


    // Clearly Rejected Patient Case Must Be Closed
    #[access_control(check_patient_case_closable(&ctx, &case_id))]
    pub fn close_rejected_case(ctx: Context<ClosePatientCase>, case_id: String) -> Result<()> {

        instructions::close_rejected_case(ctx, case_id)?;

        Ok(())
    }

    // Donors Make Donations To Patient's Escrow Accounts.
    pub fn donate(ctx: Context<Donation>, case_id: String, donation_token: Pubkey, amount_to_donate: u64, nft_uri: String) -> Result<()> {

        instructions::donate_funds_to_patient_escrow(ctx, case_id, donation_token, amount_to_donate, nft_uri)?;

        Ok(())
    }

    // AUTHORIZED MULTISIG MEMBER MAKES A PROPOSAL TO TRANSFER A CASE DONATED FUNDS TO TREATMENT WALLET
    pub fn propose_transfer(ctx: Context<ProposeFundRelease>, case_id: String, proposal_index: u64) -> Result<()> {

        instructions::propose_funds_release(ctx, case_id, proposal_index)?;
        Ok(())
    }

    // AUTHORIZED MULTISIG MEMBER CAN APPROVE PROPOSAL
    pub fn approve_proposal(ctx: Context<ApproveProposal>, case_id: String, proposal_index: u64, approval: bool) -> Result<()> {

        instructions::proposal_approve(ctx, case_id, proposal_index, approval)?;
        Ok(())
    }

    // AUTHORIZED MULTISIG TRANSFERS ACCUMULATED FUNDS TO TREATMENT WALLET 
    pub fn release_funds(ctx: Context<ReleaseFunds>, case_id: String, proposal_index: u64) -> Result<()> {

        instructions::release_funds(ctx, case_id, proposal_index)?;

        Ok(())
    }
    
}



// ........... CHECKS TO ENSURE PATIENT CASE HAS CLEARLY FAILED VERIFICATION AND SHOULD INDEED BE CLOSED ............. //
fn check_patient_case_closable(ctx: &Context<ClosePatientCase>, _case_id: &String) -> Result<()> {

    let patient_case = &ctx.accounts.patient_case;
    let verifiers_registry = &ctx.accounts.verifiers_list;

    // Check That Case Has Not Been Verified
    require!(patient_case.is_verified == false, CuraChainError::CaseAlreadyVerified);

    // Get Total No and Yes Votes Cast On This Patient Case, and The Total Length of Eligible Verifiers
    let patient_yes_votes = patient_case.verification_yes_votes;
    let patient_no_votes = patient_case.verification_no_votes;
    let total_verifiers = verifiers_registry.all_verifiers.len();

    // Total Votes Cast On Patient Case
    let patient_total_votes = patient_yes_votes + patient_no_votes;// Pretty Solid No Overflow Will Occur Here

    // If No Votes Has Been Cast, It Means Patient Case Has Not Yet Been Verified At All
    require!(patient_total_votes > 0, CuraChainError::CaseNotYetVerified);

    // ................      We Need To Ensure At Least 50% Verifiers Have Cast Their Votes            ................//

    // Let's type cast both total_votes and total_verifiers to u32 and SCALE to avoid overflow and precision loss
    let total_votes_u32_scaled = (patient_total_votes as u32).checked_mul(SCALE).ok_or(CuraChainError::OverflowError)?;
    let total_verifiers_u32_scaled = (total_verifiers as u32).checked_mul(SCALE).ok_or(CuraChainError::OverflowError)?;

    //Let's get Half Verifiers
    let half_verifiers_scaled = total_verifiers_u32_scaled.checked_mul(50).ok_or(CuraChainError::OverflowError)?
        .checked_div(100).ok_or(CuraChainError::OverflowError)?;

    require!( total_votes_u32_scaled >= half_verifiers_scaled, CuraChainError::NotEnoughVerifiers);

    // We Need To Make Sure 70% quorum for Verification Approval Was Not Reached
    let approval_threshold_70_scaled = total_votes_u32_scaled.checked_mul(70).ok_or(CuraChainError::OverflowError)?
            .checked_div(100).ok_or(CuraChainError::OverflowError)?;

    let yes_votes_scaled = (patient_case.verification_yes_votes as u32).checked_mul(SCALE).ok_or(CuraChainError::OverflowError)?;

    // Let's ensure that total yes votes was indeed less than the required 70%
    require!(yes_votes_scaled < approval_threshold_70_scaled, CuraChainError::CasePassedApproval);

    Ok(())
}