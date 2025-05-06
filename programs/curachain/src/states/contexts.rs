

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken, 
    metadata::{Metadata, MetadataAccount, MasterEditionAccount}, 
    token_interface::{ Mint, TokenAccount, TokenInterface}};

use crate::states::{accounts::*, errors::*};



// THE ADMIN CONFIG STRUCT

#[derive(Accounts)]
#[instruction(admin_address: Pubkey)]
pub struct AdminConfig<'info> {
    #[account(
        init,
        payer = initializer,
        space = 8 + 32 + 1 + 1,
        seeds = [b"admin", admin_address.key().as_ref()],
        bump
    )]
    pub admin_account: Account<'info, Administrator>,

    #[account(mut)]
    pub initializer: Signer<'info>,

    pub system_program: Program<'info, System>,
}


//There should be only the administrator who can call this function to add the verifier badge to others
#[derive(Accounts)]
#[instruction(verifier_address: Pubkey)]
pub struct VerifierInfo<'info> {
    #[account(
        mut,
        constraint = admin.key() == admin_account.admin_pubkey.key() @ CuraChainError::OnlyAdmin,
    )]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"admin", admin.key().as_ref()],
        bump = admin_account.bump
    )]
    pub admin_account: Account<'info, Administrator>,

    // let's create the Verifier PDA
    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + 32 + 1 + 1,
        seeds = [b"verifier_role", verifier_address.key().as_ref()],
        bump,
    )]
    pub verifier: Account<'info, Verifier>,

    // Adding the Global Verifiers List PDA here
    #[account(
        mut,
        seeds = [b"verifiers_list"],
        bump = verifiers_list.verifier_registry_bump,
    )]
    pub verifiers_list: Account<'info, VerifiersList>,

    pub system_program: Program<'info, System>,
}





/* Context Struct For Initializing The Global Verifiers Registry PDA account */

#[derive(Accounts)]
pub struct InitializeVerifiersRegistryMultisigAndCaseCounter<'info> {
    #[account(
        mut,
        constraint = admin.key() == admin_account.admin_pubkey.key() @ CuraChainError::OnlyAdmin,
    )]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"admin", admin.key().as_ref()],
        bump = admin_account.bump
    )]
    pub admin_account: Account<'info, Administrator>,

    #[account(
        init,
        payer = admin,
        seeds = [b"verifiers_list"],
        bump,
        space = 8 + 4 + (32 * 100) + 1,
    )]
    pub verifiers_registry_list: Account<'info, VerifiersList>,

    // Multisig 
    #[account(
        init,
        payer = admin,
        seeds = [b"multisig", b"escrow-authority".as_ref()],
        bump,
        space = 8 + Multisig::INIT_SPACE
    )]
    pub multisig: Account<'info, Multisig>,

    // Case Counter PDA here
    #[account(
        init,
        payer = admin,
        seeds = [b"case_counter"],
        bump,
        space = 8 + 8 + 1,
    )]
    pub case_counter: Account<'info, CaseCounter>,

    pub system_program: Program<'info, System>,
}


// MULTISIG OPERATIONS
#[derive(Accounts)]
pub struct AddorRemoveMultisigMember<'info> {

    #[account(
        mut,
        constraint = admin.key() == admin_account.admin_pubkey.key() @CuraChainError::OnlyAdmin,
    )]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"admin", admin.key().as_ref()],
        bump = admin_account.bump
    )]
    pub admin_account: Account<'info, Administrator>,

    #[account(
        mut,
        seeds = [b"multisig", b"escrow-authority".as_ref()],
        bump = multisig.multisig_bump
    )]
    pub multisig: Account<'info, Multisig>,
    
}

// INITIALIZE PATIENT CASE context
#[derive(Accounts)]
pub struct InitializePatientCase<'info> {
    // Signer is patient
    #[account(mut)]
    pub patient: Signer<'info>,

    #[account(
        init,
        payer = patient,
        space = 8 + PatientCase::INIT_SPACE,
        seeds = [b"patient", patient.key().as_ref()],
        bump
    )]
    pub patient_case: Account<'info, PatientCase>,

    // let's bring the Case Counter PDA here
    #[account(
        mut,
        seeds = [b"case_counter"],
        bump = case_counter.counter_bump,
    )]
    pub case_counter: Account<'info, CaseCounter>,

    // Let's Bring Up The Case ID Lookup PDA here
    #[account(
        init,
        payer = patient,
        space = 8 + CaseIDLookup::INIT_SPACE,
        seeds = [b"case_lookup",
        format!("CASE{:04}", case_counter.current_id + 1).as_bytes()],
        bump
    )]
    pub case_lookup: Account<'info, CaseIDLookup>,

    pub system_program: Program<'info, System>,
}



// A VIEW INSTRUCTION FOR TRACKING PATIENT CASE STATUS ON-CHAIN
#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct PatientDetails<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    // Let's get the Case Lookup PDA using the specified case ID of the original format, CASE####
    #[account(
        seeds = [b"case_lookup", case_id.as_bytes()],
        bump = case_lookup.case_lookup_bump,
        constraint = case_lookup.case_id_in_lookup == case_id @CuraChainError::InvalidCaseID,
    )]
    pub case_lookup: Account<'info, CaseIDLookup>,

    #[account(
        seeds = [b"patient", case_lookup.patient_address.as_ref()],
        bump = patient_case.patient_case_bump,
        constraint = patient_case.key() == case_lookup.patient_pda.key() @ CuraChainError::InvalidCaseID,
        constraint = patient_case.case_id == case_id @ CuraChainError::InvalidCaseID,
    )]
    pub patient_case: Account<'info, PatientCase>,

}

// INITIALIZE THE VERIFICATION INSTRUCTION
#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct VerifyPatientCase<'info> {
    #[account(
        mut,
        constraint = verifier.key() == verifier_account.verifier_key.key() @ CuraChainError::OnlyVerifier,
    )]
    pub verifier: Signer<'info>,

    #[account(
        mut,
        seeds = [b"verifier_role", verifier.key().as_ref()],
        bump = verifier_account.verifier_bump
    )]
    pub verifier_account: Account<'info, Verifier>,

    // I think i should add the global verifiers registry so that i can query it for the total votes cast
    #[account(
        mut,
        seeds = [b"verifiers_list"],
        bump = verifiers_list.verifier_registry_bump,
    )]
    pub verifiers_list: Account<'info, VerifiersList>,

    // Let's get the Case Lookup PDA using the specified case ID of the original format, CASE####
    #[account(
        mut,
        seeds = [b"case_lookup", case_id.as_bytes()],
        bump = case_lookup.case_lookup_bump,
        constraint = case_lookup.case_id_in_lookup == case_id @CuraChainError::InvalidCaseID,
    )]
    pub case_lookup: Account<'info, CaseIDLookup>,

    #[account(
        mut,
        seeds = [b"patient", case_lookup.patient_address.as_ref()],
        bump = patient_case.patient_case_bump,
        constraint = patient_case.key() == case_lookup.patient_pda.key() @ CuraChainError::InvalidCaseID,
        constraint = patient_case.case_id == case_id @ CuraChainError::InvalidCaseID,
    )]
    pub patient_case: Account<'info, PatientCase>,

    /// CHECKED: This account does not exist yet, and may be created upon successful verification
    #[account(
        mut,
    )]
    pub patient_escrow: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}


// IF CASE FAILS VERIFICATION, WE CALL THIS INSTRUCTION TO CLOSE THE PATIENT CASE PDA
#[derive(Accounts)]
#[instruction(case_id: String)]

pub struct ClosePatientCase<'info> {

    // Anybody can call this instruction to close the patient case
    #[account(mut)]
    pub user: Signer<'info>,

    // Let's get the Case Lookup PDA using the specified case ID of the original format, CASE####
    #[account(
        mut,
        seeds = [b"case_lookup", case_id.as_bytes()],
        bump = case_lookup.case_lookup_bump,
        constraint = case_lookup.case_id_in_lookup == case_id @CuraChainError::InvalidCaseID,
    )]
    pub case_lookup: Account<'info, CaseIDLookup>,

    #[account(
        mut,
        close = user,// I would like the lamports to return to the person closing this account.
        seeds = [b"patient", case_lookup.patient_address.as_ref()],
        bump = patient_case.patient_case_bump,
        constraint = patient_case.key() == case_lookup.patient_pda.key() @ CuraChainError::InvalidCaseID,
        constraint = patient_case.case_id == case_id @ CuraChainError::InvalidCaseID,
    )]
    pub patient_case: Account<'info, PatientCase>,

    // Have The Verifier Registry So I Can Query The Expected Number Of Verifiers To Have Voted
    #[account(
        mut,
        seeds = [b"verifiers_list"],
        bump = verifiers_list.verifier_registry_bump,
    )]
    pub verifiers_list: Account<'info, VerifiersList>,

    pub system_program: Program<'info, System>,
}






/*
@. 1. Donor Can Donate Any Preferred token to a particular case
@. 2. Donor Account That Tracks Donations Across All Cases
@. 3. Recognition NFT for Donor
 */

// DONOR'S CONTEXT STRUCT
#[derive(Accounts)]
#[instruction(case_id: String, token_to_donate: Pubkey)]
pub struct Donation<'info> {
    #[account(mut)]
    pub donor: Signer<'info>,

    #[account(
        constraint = donation_token.key() == token_to_donate @CuraChainError::TokenMismatched
    )]
    pub donation_token: InterfaceAccount<'info, Mint>,

    // Donor ATA
    #[account(
        mut,
        associated_token::mint = donation_token,
        associated_token::authority = donor.key()
    )]
    pub donor_ata: InterfaceAccount<'info, TokenAccount>,

    // Get Case Lookup pda using specified Case ID
    #[account(
        mut,
        seeds = [b"case_lookup", case_id.as_bytes()],
        bump = case_lookup.case_lookup_bump,
        constraint = case_lookup.case_id_in_lookup == case_id @CuraChainError::InvalidCaseID,
    )]
    pub case_lookup: Account<'info, CaseIDLookup>,

    // We Use the case_lookup to find the Patient case
    #[account(
        mut,
        seeds = [b"patient", case_lookup.patient_address.as_ref()],
        bump = patient_case.patient_case_bump,
        constraint = patient_case.key() == case_lookup.patient_pda.key() @ CuraChainError::InvalidCaseID,
        constraint = patient_case.case_id == case_id @ CuraChainError::InvalidCaseID,
    )]
    pub patient_case: Account<'info, PatientCase>,

    /// CHECKED: This account has already been created and it's safe now. 
    #[account(
        mut,
        //seeds = [b"patient_escrow", patient_case.case_id.as_bytes() ,patient_case.key().as_ref(),],
        //bump = case_lookup.patient_escrow_bump,
    )]
    pub patient_escrow: AccountInfo<'info>,

    // Get Associated Token Vault For Specified Patient Case
    #[account(
        init_if_needed,
        payer = donor,
        seeds = [
            b"patient_token_vault",
            case_id.as_bytes().as_ref(),
            patient_escrow.key().as_ref(),
            donation_token.key().as_ref()
        ],
        bump,
        token::authority = multisig,
        token::mint = donation_token
    )]
    pub patient_token_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"multisig", b"escrow-authority".as_ref()],
        bump = multisig.multisig_bump
    )]
    pub multisig: Account<'info, Multisig>,

    // Donor Info PDA here
    #[account(
        init_if_needed,
        payer = donor,
        seeds = [b"donor", donor.key().as_ref()],
        bump,
        space = 8 + DonorInfo::INIT_SPACE,
    )]
    pub donor_account: Account<'info, DonorInfo>,

    // RECOGNITION NFT LOGIC
    // Recognition Collection NFT for Curachain ----- Assumes Program's NFT Recognition Has Been Minted
    pub recognition_collection_nft: InterfaceAccount<'info, Mint>,

    // Create A Child Mint For Each Donor-Case
    #[account(
        init_if_needed,
        payer = donor,
        seeds = [b"recognition_nft", donor.key().as_ref(), case_id.as_bytes()],
        bump,
        mint::decimals = 0,
        mint::authority = multisig
    )]
    pub donor_nft_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = donor,
        associated_token::mint = donor_nft_mint,
        associated_token::authority = donor,
    )]
    pub donor_nft_account: InterfaceAccount<'info, TokenAccount>,

    // donor nft is a regular nft, verified to belong to the collection nft of curachain
    #[account(
        seeds =[
            b"metadata",
            metadata_program.key().as_ref(),
            donor_nft_mint.key().as_ref()
        ],
        seeds::program = metadata_program.key(),
        bump,
        constraint = donor_nft_metadata.collection.as_ref().unwrap().key.as_ref() == donor_nft_mint.key().as_ref() @CuraChainError::InvalidCollectionMint,
        constraint = donor_nft_metadata.collection.as_ref().unwrap().verified,
        constraint = donor_nft_metadata.collection_details == None,
    )]
    pub donor_nft_metadata: Account<'info, MetadataAccount>,

    #[account(
        seeds =[
            b"metadata",
            metadata_program.key().as_ref(),
            donor_nft_mint.key().as_ref(),
            b"edition",
        ],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub master_edition: Account<'info, MasterEditionAccount>,

    pub metadata_program: Program<'info, Metadata>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub token_program: Interface<'info, TokenInterface>,

    pub system_program: Program<'info, System>,
}


// Multisig Operations => Any of The Members Can Propose Funds Release
#[derive(Accounts)]
#[instruction(case_id: String, proposal_index: u64)]
pub struct ProposeFundRelease<'info> {

    #[account(
        mut,
        constraint = multisig.multisig_members.contains(&proposer.key) @CuraChainError::NotMultisigMember,
    )]
    pub proposer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"multisig", b"escrow-authority".as_ref()],
        bump = multisig.multisig_bump
    )]
    pub multisig: Account<'info, Multisig>,

    // Get Case Lookup pda using specified Case ID
    #[account(
        mut,
        seeds = [b"case_lookup", case_id.as_bytes()],
        bump = case_lookup.case_lookup_bump,
        constraint = case_lookup.case_id_in_lookup == case_id @CuraChainError::InvalidCaseID,
    )]
    pub case_lookup: Account<'info, CaseIDLookup>,

    // We Use the case_lookup to find the Patient case
    #[account(
        mut,
        seeds = [b"patient", case_lookup.patient_address.as_ref()],
        bump = patient_case.patient_case_bump,
        constraint = patient_case.key() == case_lookup.patient_pda.key() @ CuraChainError::InvalidCaseID,
        constraint = patient_case.case_id == case_id @ CuraChainError::InvalidCaseID,
    )]
    pub patient_case: Account<'info, PatientCase>,

    // Initialize The Proposal
    #[account(
        init,
        payer = proposer,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [b"proposal", case_id.as_bytes(), proposal_index.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}


// Multisig Members Votes To Either Approve Or Reject The Transfer Proposal
#[derive(Accounts)]
#[instruction(case_id: String, proposal_index: u64)]
pub struct ApproveProposal<'info> {
    #[account(
        mut,
        constraint = multisig.multisig_members.contains(&multisig_member.key) @CuraChainError::NotMultisigMember,
    )]
    pub multisig_member: Signer<'info>,

    #[account(
        mut,
        seeds = [b"multisig", b"escrow-authority".as_ref()],
        bump = multisig.multisig_bump
    )]
    pub multisig: Account<'info, Multisig>,

    // Get Case Lookup pda using specified Case ID
    #[account(
        mut,
        seeds = [b"case_lookup", case_id.as_bytes()],
        bump = case_lookup.case_lookup_bump,
        constraint = case_lookup.case_id_in_lookup == case_id @CuraChainError::InvalidCaseID,
    )]
    pub case_lookup: Account<'info, CaseIDLookup>,

    // Get The Proposal
    #[account(
        mut,
        seeds = [b"proposal", case_id.as_bytes(), proposal_index.to_le_bytes().as_ref()],
        bump = proposal.proposal_bump,
    )]
    pub proposal: Account<'info, Proposal>,
}


// FUND RELEASE TO TREATMENT FACILITY
#[derive(Accounts)]
#[instruction(case_id: String, proposal_index: u64)]
pub struct ReleaseFunds<'info> {
    // Get Case Lookup pda using specified Case ID
    #[account(
        mut,
        seeds = [b"case_lookup", case_id.as_bytes()],
        bump = case_lookup.case_lookup_bump,
        constraint = case_lookup.case_id_in_lookup == case_id @CuraChainError::InvalidCaseID,
    )]
    pub case_lookup: Account<'info, CaseIDLookup>,

    // We Use the case_lookup to find the Patient case
    #[account(
        mut,
        seeds = [b"patient", case_lookup.patient_address.as_ref()],
        bump = patient_case.patient_case_bump,
        constraint = patient_case.key() == case_lookup.patient_pda.key() @ CuraChainError::InvalidCaseID,
        constraint = patient_case.case_id == case_id @ CuraChainError::InvalidCaseID,
    )]
    pub patient_case: Account<'info, PatientCase>,

    /// CHECKED: This account has already been created and it's safe now. 
    #[account(
        mut,
        //seeds = [b"patient_escrow", case_id.as_bytes().as_ref() ,patient_case.key().as_ref(),],
        //bump = case_lookup.patient_escrow_bump,
        owner = system_program.key(),
    )]
    pub patient_escrow: AccountInfo<'info>,

    ///CHECKED: The Facility Address To Receive Funds For Patient Treatment
    #[account(mut)]
    pub facility_address: AccountInfo<'info>,

    // Facility Token ATA:= to receive spl donations made to a case

    // Any Of The Multisig Members ( Of Which Admin Is A Member) Can Initiate Transfer
    #[account(
        mut,
        constraint = multisig.multisig_members.contains(&transfer_authority.key) @ CuraChainError::UnauthorizedToTransfer,
    )]
    pub transfer_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"multisig", b"escrow-authority".as_ref()],
        bump = multisig.multisig_bump
    )]
    pub multisig: Account<'info, Multisig>,

    // Get The Proposal
    #[account(
        mut,
        seeds = [b"proposal", case_id.as_bytes(), proposal_index.to_le_bytes().as_ref()],
        bump = proposal.proposal_bump,
    )]
    pub proposal: Account<'info, Proposal>,

    /// CHECKED:  Remaining Accounts: Token Mint In Spl Donations, Patient Token Vault, Facility ATA
    //pub remaining_accounts: Vec<AccountInfo<'info>>,

    pub system_program: Program<'info, System>,

    pub associated_token: Program<'info, AssociatedToken>,

    pub token_program: Interface<'info, TokenInterface>
}
