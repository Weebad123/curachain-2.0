import fs from "fs";
import path from "path";
import { Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

// Function to generate keypairs and save them to files
function generateWallets() {
  // List of wallet names to generate
  const walletNames = [
    "verifier1",
    "verifier2",
    "verifier3",
    "verifier4",
    "verifier5",
    "verifier6",
    "patient1",
    "patient2",
    "patient3",
    "patient4",
    "donor1",
    "donor2",
    "donor3",
    "facility1",
    "facility4",
  ];

  // Path to wallets directory
  const walletsDir = path.resolve(process.cwd(), "wallets");

  // Generate and save each wallet
  walletNames.forEach((name) => {
    // Generate new keypair
    const keypair = Keypair.generate();

    // Create filename
    const filename = `${name}-wallet.json`;
    const filePath = path.join(walletsDir, filename);

    // Save private key as JSON array
    fs.writeFileSync(
      filePath,
      JSON.stringify(Array.from(keypair.secretKey)),
      "utf-8"
    );

    console.log(`Generated ${name} wallet: ${keypair.publicKey.toString()}`);
    console.log(`Saved to: ${filePath}`);
  });

  console.log("\nAll wallets generated successfully!");
}

// Run the function
generateWallets();
