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
const donor1keypair = loadWallet("donor1");
const donor2keypair = loadWallet("donor2");
const donor3keypair = loadWallet("donor3");

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

const donor1DonateToPatient4 = async () => {
  // Get Respective PDAs
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

  // Let's call the donate instruction
  try {
    const don1pat4tx = await program.methods
      .donate("CASE0003", new BN(0.0005 * anchor.web3.LAMPORTS_PER_SOL))
      .accounts({
        donor: donor1keypair.publicKey,
        patientEscrow: patient4EscrowPDA,
      })
      .signers([donor1keypair])
      .rpc();

    console.log(
      "View Transaction of Donor 1 Donating Funds To Verified Patient 4 Case Here",
      `https://explorer.solana.com/tx/${don1pat4tx}?cluster=devnet`
    );
  } catch (err) {
    console.log(err);
  }
};

// Call the Donor1DonateToPatient1 function
//donor1DonateToPatient1();

const donor3DonateToPatient4 = async () => {
  // Get Respective PDAs
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

  // Let's call the donate instruction
  try {
    const don2pat4tx = await program.methods
      .donate("CASE0003", new BN(0.008 * anchor.web3.LAMPORTS_PER_SOL))
      .accounts({
        donor: donor2keypair.publicKey,
        patientEscrow: patient4EscrowPDA,
      })
      .signers([donor2keypair])
      .rpc();

    console.log(
      "View Transaction of Donor 1 Donating Funds To Verified Patient 1 Case Here",
      `https://explorer.solana.com/tx/${don2pat4tx}?cluster=devnet`
    );
  } catch (err) {
    console.log(err);
  }
};

// Let's Call The function one after the other by commenting the others
donor1DonateToPatient4();
donor3DonateToPatient4();
