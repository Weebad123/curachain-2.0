import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, utils, BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import type { Curachain } from "../target/types/curachain";

import { utf8 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { count } from "console";

// Load IDL
const idlFile = fs.readFileSync(
  path.resolve(__dirname, "./curachain.json"),
  "utf-8"
);
const idl = JSON.parse(idlFile);
const programID = new PublicKey(idl.address);

// Set up connection to devnet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// HELPER FUNCTION TO LOAD THE WALLETS
function loadWallet(name: string): Keypair {
  const walletPath = path.resolve(
    process.cwd(),
    "wallets",
    `${name}-wallet.json`
  );
  const keypairData = fs.readFileSync(walletPath, "utf-8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keypairData)));
}

// Let's Load the 3 patients
const patient2keypair = loadWallet("patient2");
const patient3keypair = loadWallet("patient2");
const patient4keypair = loadWallet("patient4");
const patient1keypair = loadWallet("patient1");

// Load wallet from keypair file
// Replace with path to your keypair file
const keypairFile = fs.readFileSync(
  path.resolve(__dirname, "turbin3-wallet.json"),
  "utf-8"
);
const walletKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(keypairFile))
);

// Create wallet object for Anchor
const wallet = new anchor.Wallet(walletKeypair);

// Set up provider
const provider = new AnchorProvider(connection, wallet, {
  commitment: "confirmed",
});
anchor.setProvider(provider);

// Initialize program
const program = new Program<Curachain>(idl, provider);

// LET PATIENT 1 SUBMIT A CASE TO CURACHAIN
const patient2SubmitCase = async () => {
  // Let's skip the pdas derivation here

  try {
    const [caseCounterPDA, caseCounterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_counter")],
      programID
    );

    const counterData = await program.account.caseCounter.fetch(caseCounterPDA);
    const incrementid = counterData.currentId.add(new BN(1));
    const caseId = "CASE" + incrementid.toString().padStart(4, "0");

    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from(caseId)],
      programID
    );
    const patient2tx = await program.methods
      .submitCases(
        "Suffering from Cauda equina syndrome. My bowels are already damaged. Doctors diagnosis claim I need to undergo decompression surgery in the next 14 days to avoid further damage to my legs and sexual organs. Please help me.",
        new BN(3000000),
        "https://onedrive.com/microsoft/medical_folders/1yzZhzQfxStj2LQP6_Yp6jquVnjT8qX-u?usp=sharing"
      )
      .accounts({
        patient: patient2keypair.publicKey,
        //@ts-ignore
        caseLookup: caseLookupPDA,
      })
      .signers([patient2keypair])
      .rpc();

    console.log(
      "View Patient Case Submission transaction on Solana Explorer here",
      `https://explorer.solana.com/tx/${patient2tx}?cluster=devnet`
    );
  } catch (err) {
    console.log(err);
  }
};

// Call the function here
//patient2SubmitCase();

/**   -----------------------  PATIENT 4 SUBMITS A CASE   ----------------------------------- */
// LET PATIENT 4 SUBMIT A CASE TO CURACHAIN
const patient4SubmitCase = async () => {
  // Let's skip the pdas derivation here

  try {
    const [caseCounterPDA, caseCounterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_counter")],
      programID
    );

    const counterData = await program.account.caseCounter.fetch(caseCounterPDA);
    const incrementid = counterData.currentId.add(new BN(1));
    const caseId = "CASE" + incrementid.toString().padStart(4, "0");

    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from(caseId)],
      programID
    );
    const patient4tx = await program.methods
      .submitCases(
        "Suffering from Mesothelioma for 2 years now. Doctors diagnosis suggests I undergo the prophylactic treatment, which costs about 20,000 dollars every month. Please Kindly contribute towards my treatment.",
        new BN(95500000),
        "https://dropbox.com/facony22/medical_files/1yzZjuzQfxStj2LQP6_Yp6jquVnjT8qX-u?usp=sharing"
      )
      .accounts({
        patient: patient4keypair.publicKey,
        //@ts-ignore
        caseLookup: caseLookupPDA,
      })
      .signers([patient4keypair])
      .rpc();

    console.log(
      "View Patient Case Submission transaction on Solana Explorer here",
      `https://explorer.solana.com/tx/${patient4tx}?cluster=devnet`
    );
  } catch (err) {
    console.log(err);
  }
};

// let's call the patient 4 function here
//patient4SubmitCase();

// Let Patient 1
const patient3SubmitCase = async () => {
  // Let's skip the pdas derivation here

  try {
    const [caseCounterPDA, caseCounterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_counter")],
      programID
    );

    const counterData = await program.account.caseCounter.fetch(caseCounterPDA);
    const incrementid = counterData.currentId.add(new BN(1));
    const caseId = "CASE" + incrementid.toString().padStart(5, "0");

    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from(caseId)],
      programID
    );
    const patient3tx = await program.methods
      .submitCases(
        "Suffering from Kidney Dialysis for 1 years now. Doctors diagnosis suggests I undergo the prophylactic treatment, which costs about 20,000 dollars every month. Please Kindly contribute towards my treatment.",
        new BN(1000000000),
        "https://dropbox.com/facony22/medical_files/1yzZjuzQfxStj2LQP6_Yp6jquVnjT8qX-u?usp=sharing"
      )
      .accounts({
        patient: patient3keypair.publicKey,
        //@ts-ignore
        caseLookup: caseLookupPDA,
      })
      .signers([patient3keypair])
      .rpc();

    console.log(
      "View Patient Case Submission transaction on Solana Explorer here",
      `https://explorer.solana.com/tx/${patient3tx}?cluster=devnet`
    );
  } catch (err) {
    console.log(err);
  }
};
patient3SubmitCase();