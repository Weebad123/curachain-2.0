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

// Let's Load the Verifiers wallets
const verifier1keypair = loadWallet("verifier1");
const verifier2keypair = loadWallet("verifier2");
const verifier3keypair = loadWallet("verifier3");
const verifier4keypair = loadWallet("verifier4");
const verifier5keypair = loadWallet("verifier5");
const verifier6keypair = loadWallet("verifier6");

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

const patient4keypair = loadWallet("patient4");

const verify1Patient4Case = async () => {
  // We Get The Various PDAs
  const [patient4CasePDA, patient4CaseBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("patient"), patient4keypair.publicKey.toBuffer()],
    programID
  );

  const [patient4EscrowPDA, patient4EscrowBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("patient_escrow"),
        Buffer.from("CASE0003"),
        patient4CasePDA.toBuffer(),
      ],
      programID
    );

  // Let's call the verify instruction
  try {
    const ver1pat4tx = await program.methods
      .verifyPatient("CASE0003", true)
      .accounts({
        patientEscrow: patient4EscrowPDA,
        verifier: verifier1keypair.publicKey,
      })
      .signers([verifier1keypair])
      .rpc();

    // Log the transaction
    console.log(
      "Verification Vote On Patient 4 Case by Verifier 1",
      `https://explorer.solana.com/tx/${ver1pat4tx}?cluster=devnet`
    );
  } catch (err) {
    console.log(err);
  }
};

//verify1Patient1Case();

// Verifier 2 Doing Verification On Patient 4
const verify2Patient4Case = async () => {
  // We Get The Various PDAs

  const [patient4CasePDA, patient4CaseBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("patient"), patient4keypair.publicKey.toBuffer()],
    programID
  );

  const [patient4EscrowPDA, patient4EscrowBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("patient_escrow"),
        Buffer.from("CASE0003"),
        patient4CasePDA.toBuffer(),
      ],
      programID
    );

  // Let's call the verify instruction
  try {
    const ver2pat4tx = await program.methods
      .verifyPatient("CASE0003", true)
      .accounts({
        patientEscrow: patient4EscrowPDA,
        verifier: verifier2keypair.publicKey,
      })
      .signers([verifier2keypair])
      .rpc();

    // Log the transaction
    console.log(
      "Verification Vote On Patient 4 Case by Verifier 2",
      `https://explorer.solana.com/tx/${ver2pat4tx}?cluster=devnet`
    );
  } catch (err) {
    console.log(err);
  }
};

//verify2Patient1Case();

// Verifier3 Doing Verification On Patient 1
// Verifier 3 Doing Verification On Patient 1
const verify3Patient4Case = async () => {
  // We Get The Various PDAs
  const [patient4CasePDA, patient4CaseBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("patient"), patient4keypair.publicKey.toBuffer()],
    programID
  );

  const [patient4EscrowPDA, patient4EscrowBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("patient_escrow"),
        Buffer.from("CASE0003"),
        patient4CasePDA.toBuffer(),
      ],
      programID
    );

  // Let's call the verify instruction
  try {
    const ver3pat4tx = await program.methods
      .verifyPatient("CASE0003", false)
      .accounts({
        patientEscrow: patient4EscrowPDA,
        verifier: verifier3keypair.publicKey,
      })
      .signers([verifier3keypair])
      .rpc();

    // Log the transaction
    console.log(
      "Verification Vote On Patient 4 Case by Verifier 3",
      `https://explorer.solana.com/tx/${ver3pat4tx}?cluster=devnet`
    );
  } catch (err) {
    console.log(err);
  }
};

//verify3Patient1Case();

// Verifier 4 Doing Verification On
const verify4Patient4Case = async () => {
  // We Get The Various PDAs
  const [patient4CasePDA, patient4CaseBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("patient"), patient4keypair.publicKey.toBuffer()],
    programID
  );

  const [patient4EscrowPDA, patient4EscrowBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("patient_escrow"),
        Buffer.from("CASE0003"),
        patient4CasePDA.toBuffer(),
      ],
      programID
    );

  // Let's call the verify instruction
  try {
    const ver4pat4tx = await program.methods
      .verifyPatient("CASE0003", true)
      .accounts({
        patientEscrow: patient4EscrowPDA,
        verifier: verifier4keypair.publicKey,
      })
      .signers([verifier4keypair])
      .rpc();

    // Log the transaction
    console.log(
      "Verification Vote On Patient 4 Case by Verifier 4",
      `https://explorer.solana.com/tx/${ver4pat4tx}?cluster=devnet`
    );
  } catch (err) {
    console.log(err);
  }
};

// Verifier 5 Doing Verification On Case 4
const verify5Patient4Case = async () => {
  // We Get The Various PDAs
  const [patient4CasePDA, patient4CaseBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("patient"), patient4keypair.publicKey.toBuffer()],
    programID
  );

  const [patient4EscrowPDA, patient4EscrowBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("patient_escrow"),
        Buffer.from("CASE0003"),
        patient4CasePDA.toBuffer(),
      ],
      programID
    );

  // Let's call the verify instruction
  try {
    const ver5pat4tx = await program.methods
      .verifyPatient("CASE0003", true)
      .accounts({
        patientEscrow: patient4EscrowPDA,
        verifier: verifier5keypair.publicKey,
      })
      .signers([verifier5keypair])
      .rpc();

    // Log the transaction
    console.log(
      "Verification Vote On Patient 4 Case by Verifier 5",
      `https://explorer.solana.com/tx/${ver5pat4tx}?cluster=devnet`
    );
  } catch (err) {
    console.log(err);
  }
};

// Call The Below Function one after the other by commenting the others:
//verify1Patient4Case();
//verify2Patient4Case();
//verify3Patient4Case();
//verify4Patient4Case();
verify5Patient4Case();
