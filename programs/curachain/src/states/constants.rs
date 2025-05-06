use anchor_lang::prelude::*;
use anchor_spl::token::spl_token;

pub const SCALE: u32 = 10000;

// Wrapped SOL Mint Address
pub const NATIVE_SOL_MINT_ADDRESS: Pubkey = spl_token::native_mint::id();

pub const MULTISIG_THRESHOLD: u8 = 3;