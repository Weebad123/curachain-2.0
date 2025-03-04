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

// Let's Load the Verifiers wallets and treatment facility
const verifier1keypair = loadWallet("verifier1");
const verifier2keypair = loadWallet("verifier2");
const verifier3keypair = loadWallet("verifier3");
const treatment4keypair = loadWallet("facility4");

// Load wallet from keypair file
// Replace with path to your keypair file
const adminkeypairFile = fs.readFileSync(
  path.resolve(__dirname, "turbin3-wallet.json"),
  "utf-8"
);
const adminwalletKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(adminkeypairFile))
);

// Create wallet object for Anchor
const wallet = new anchor.Wallet(adminwalletKeypair);

// Set up provider
const provider = new AnchorProvider(connection, wallet, {
  commitment: "confirmed",
});
anchor.setProvider(provider);

// Initialize program
const program = new Program<Curachain>(idl, provider);

const patient4keypair = loadWallet("patient4");

/** ------------------------ RELEASE FUNDS OF CASE 1     ------------------------------  */
const releaseFundsOfCase4 = async () => {
  // Get Respective PDA accounts
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

  try {
    const releaseFunds4tx = await program.methods
      .releaseFunds("CASE0003")
      .accounts({
        patientEscrow: patient4EscrowPDA,
        verifier1: verifier1keypair.publicKey,
        verifier2: verifier2keypair.publicKey,
        verifier3: verifier3keypair.publicKey,
        admin: adminwalletKeypair.publicKey,
        facilityAddress: treatment4keypair.publicKey,
      })
      .signers([
        adminwalletKeypair,
        verifier1keypair,
        verifier2keypair,
        verifier3keypair,
      ])
      .rpc();

    console.log(
      "View The Release Of Funds To Case I Treatment Facility transaction Here",
      `https://explorer.solana.com/tx/${releaseFunds4tx}?cluster=devnet`
    );
  } catch (err) {
    console.log(err);
  }
};

// Let's call the Function Below
releaseFundsOfCase4();
