import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, utils, BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import type { Curachain } from "../target/types/curachain";
//import * as wallets from "./wallets";
import { utf8 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

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

//Loading Keypairs:
const verifier1keypair = loadWallet("verifier1");
const verifier2keypair = loadWallet("verifier2");
const verifier3keypair = loadWallet("verifier3");
const verifier4keypair = loadWallet("verifier4");
const verifier5keypair = loadWallet("verifier5");
const verifier6keypair = loadWallet("verifier6");
// Patients
const patient1keypair = loadWallet("patient1");
const donor1keypair = loadWallet("donor1");

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

// Function to initialize admin
const initializeAdmin = async () => {
  // Get Admin PDA
  const [adminPDA, adminBump] = PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode("admin"), wallet.publicKey.toBuffer()],
    programID
  );

  console.log("Initializing admin with address:", wallet.publicKey.toString());
  console.log("Admin PDA:", adminPDA.toString());

  try {
    const tx = await program.methods
      .initializeAdministrator(wallet.publicKey)
      .accounts({
        initializer: wallet.publicKey,
        // Add any other accounts required by your program
      })
      .signers([])
      .rpc();

    console.log("Transaction submitted successfully:", tx);
    console.log(
      "View transaction on Solana Explorer:",
      `https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
  } catch (err) {
    console.error("There was an error initializing the Admin:", err);
  }
};

// Function to initialize the Global Registry of Verifiers
const initializeGlobalRegistryAndCounter = async () => {
  // The Signer Is The Admin
  // Anchor Would Automatically Infer The verifiersList, CounterPDA and the AdminPDA itself
  try {
    const tx = await program.methods
      .initializeGlobalVerifiersListAndCaseCounter()
      .accounts({ admin: wallet.publicKey })
      .signers([])
      .rpc();

    console.log(
      "Global Registry Initialization transaction Submitted Successfully"
    );
    console.log(
      "View transaction on Solana Explorer: ",
      `https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
  } catch (err) {
    console.error(
      "There was an error initializing the Global Registry and Case Counter:",
      err
    );
  }
};

// INITIALIZE VERIFIERS TO THE GLOBAL REGISTRY
const addVerifierToRegistry = async () => {
  //
  const [adminPDA, adminBump] = PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode("admin"), wallet.publicKey.toBuffer()],
    programID
  );
  const [verifier1PDA, verifier1Bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("verifier_role"), verifier1keypair.publicKey.toBuffer()],
    programID
  );
  const [verifier2PDA, verifier2Bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("verifier_role"), verifier2keypair.publicKey.toBuffer()],
    programID
  );
  const [verifier3PDA, verifier3Bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("verifier_role"), verifier3keypair.publicKey.toBuffer()],
    programID
  );
  const [verifier4PDA, verifier4Bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("verifier_role"), verifier4keypair.publicKey.toBuffer()],
    programID
  );
  const [verifier5PDA, verifier5Bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("verifier_role"), verifier5keypair.publicKey.toBuffer()],
    programID
  );
  const [verifier6PDA, verifier6Bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("verifier_role"), verifier6keypair.publicKey.toBuffer()],
    programID
  );

  // Let's get the Global Registry PDA
  const [verifiersRegistryPDA, verifiersRegistryBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("verifiers_list")],
      programID
    );
  try {
    const tx1 = await program.methods
      .addOrRemoveVerifier(verifier1keypair.publicKey, { add: {} })
      .accounts({
        admin: wallet.publicKey,
        // @ts-ignore
        adminAccount: adminPDA,
        verifier: verifier1PDA,
        verifiersList: verifiersRegistryPDA,
      })
      .signers([walletKeypair])
      .rpc();

    console.log(
      "View Verifier Addition transaction on Solana Explorer",
      `https://explorer.solana.com/tx/${tx1}?cluster=devnet`
    );
  } catch (err) {
    console.error(
      "There was an error adding verifier to the Global Registry",
      err
    );
  }

  try {
    const tx2 = await program.methods
      .addOrRemoveVerifier(verifier2keypair.publicKey, { add: {} })
      .accounts({
        admin: wallet.publicKey,
        // @ts-ignore
        adminAccount: adminPDA,
        verifier: verifier2PDA,
        verifiersList: verifiersRegistryPDA,
      })
      .signers([walletKeypair])
      .rpc();

    console.log(
      "View Verifier Addition transaction on Solana Explorer",
      `https://explorer.solana.com/tx/${tx2}?cluster=devnet`
    );
  } catch (err) {
    console.error(
      "There was an error adding verifier to the Global Registry",
      err
    );
  }

  try {
    const tx3 = await program.methods
      .addOrRemoveVerifier(verifier3keypair.publicKey, { add: {} })
      .accounts({
        admin: wallet.publicKey,
        // @ts-ignore
        adminAccount: adminPDA,
        verifier: verifier3PDA,
        verifiersList: verifiersRegistryPDA,
      })
      .signers([walletKeypair])
      .rpc();

    console.log(
      "View Verifier Addition transaction on Solana Explorer",
      `https://explorer.solana.com/tx/${tx3}?cluster=devnet`
    );
  } catch (err) {
    console.error(
      "There was an error adding verifier to the Global Registry",
      err
    );
  }

  try {
    const tx4 = await program.methods
      .addOrRemoveVerifier(verifier4keypair.publicKey, { add: {} })
      .accounts({
        admin: wallet.publicKey,
        // @ts-ignore
        adminAccount: adminPDA,
        verifier: verifier4PDA,
        verifiersList: verifiersRegistryPDA,
      })
      .signers([walletKeypair])
      .rpc();

    console.log(
      "View Verifier Addition transaction on Solana Explorer",
      `https://explorer.solana.com/tx/${tx4}?cluster=devnet`
    );
  } catch (err) {
    console.error(
      "There was an error adding verifier to the Global Registry",
      err
    );
  }

  try {
    const tx5 = await program.methods
      .addOrRemoveVerifier(verifier5keypair.publicKey, { add: {} })
      .accounts({
        admin: wallet.publicKey,
        // @ts-ignore
        adminAccount: adminPDA,
        verifier: verifier5PDA,
        verifiersList: verifiersRegistryPDA,
      })
      .signers([walletKeypair])
      .rpc();

    console.log(
      "View Verifier Addition transaction on Solana Explorer",
      `https://explorer.solana.com/tx/${tx5}?cluster=devnet`
    );
  } catch (err) {
    console.error(
      "There was an error adding verifier to the Global Registry",
      err
    );
  }

  try {
    const tx6 = await program.methods
      .addOrRemoveVerifier(verifier6keypair.publicKey, { add: {} })
      .accounts({
        admin: wallet.publicKey,
        // @ts-ignore
        adminAccount: adminPDA,
        verifier: verifier6PDA,
        verifiersList: verifiersRegistryPDA,
      })
      .signers([walletKeypair])
      .rpc();

    console.log(
      "View Verifier Addition transaction on Solana Explorer",
      `https://explorer.solana.com/tx/${tx6}?cluster=devnet`
    );
  } catch (err) {
    console.error(
      "There was an error adding verifier to the Global Registry",
      err
    );
  }
};

// LET PATIENT 1 SUBMIT A CASE TO CURACHAIN
const patient1SubmitCase = async () => {
  // Let's skip the pdas derivation here

  try {
    const [caseCounterPDA, caseCounterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_counter")],
      programID
    );

    const counterData = await program.account.caseCounter.fetch(caseCounterPDA);
    const caseId = "CASE" + counterData.currentId.toString().padStart(4, "0");

    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0001")],
      programID
    );
    const patient1tx = await program.methods
      .submitCases(
        "Suffering Angelman Syndrome for a decade now. This disease has no cure and Doctors diagnosis claim I need to undergo the symptomatic management as soon as possible. Please help me.",
        new BN(500000),
        "https://drive.google.com/drive/folders/1yzZtzQfsShj2LQP6_Yp6jquVnjT8qX-u?usp=sharing"
      )
      .accounts({
        patient: patient1keypair.publicKey,
        //@ts-ignore
        caseLookup: caseLookupPDA,
      })
      .signers([patient1keypair])
      .rpc();

    console.log(
      "View Patient Case Submission transaction on Solana Explorer here",
      `https://explorer.solana.com/tx/${patient1tx}?cluster=devnet`
    );
  } catch (err) {
    console.log(err);
  }
};
// Main function to run our client
const main = async () => {
  try {
    //await initializeAdmin();
    // Function To Initialize Global Registry
    //await initializeGlobalRegistryAndCounter();
    // Adding Verifier 1
    //await addVerifierToRegistry();

    // Patient 1 Submit Case To Curachain
    await patient1SubmitCase();
  } catch (error) {
    console.error("Client error:", error);
  }
};

// Run the client
main();
