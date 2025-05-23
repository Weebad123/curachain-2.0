import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Curachain } from "../target/types/curachain";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  ComputeBudgetProgram,
  Transaction,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  createAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  mintToChecked,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { assert, expect } from "chai";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";

// Imports For The Nft Collection
import { createNft, Metadata, MasterEdition, MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, isSigner, percentAmount } from "@metaplex-foundation/umi";

describe("curachain", () => {
  // Configure the client to use the local cluster.

  /////////////  ..................             TEST SETUP        ......................   ////////
  const provider = anchor.AnchorProvider.env();

  anchor.setProvider(provider);

  const program = anchor.workspace.Curachain as Program<Curachain>;

  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 1_000_000
  });
  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 1
  });

  // Token Mints To Be Donated To Case
  let usdcTokenMint: PublicKey;
  let daiTokenMint: PublicKey;
  let ethTokenMint: PublicKey;
  const solMint = NATIVE_MINT;
  let collectionMint: Keypair;
  let parentCollectionNftMetadataPDA: PublicKey;
  let parentCollectionMasterEditionPDA: PublicKey;

  /* Let's set up the actors in the system */
  const mediAdmin = provider.wallet; // 5 SOL to pay transaction fees
  const newAdmin = anchor.web3.Keypair.generate();
  const mintAuthority = anchor.web3.Keypair.generate();
  const verifier1Keypair = anchor.web3.Keypair.generate(); // 2 SOL
  const verifier2Keypair = anchor.web3.Keypair.generate();
  const verifier3Keypair = anchor.web3.Keypair.generate();
  const verifier4Keypair = anchor.web3.Keypair.generate();
  const verifier5Keypair = anchor.web3.Keypair.generate();
  const verifier6Keypair = anchor.web3.Keypair.generate();
  const verifier7Keypair = anchor.web3.Keypair.generate();
  const verifier8Keypair = anchor.web3.Keypair.generate();
  const verifier9Keypair = anchor.web3.Keypair.generate();
  const verifier10Keypair = anchor.web3.Keypair.generate();
  const verifier11Keypair = anchor.web3.Keypair.generate();
  const donor1Keypair = anchor.web3.Keypair.generate(); // 10 SOL
  const donor2Keypair = anchor.web3.Keypair.generate(); // 10 SOL
  const donor3Keypair = anchor.web3.Keypair.generate(); // 10 SOL
  const patient1Keypair = anchor.web3.Keypair.generate(); // 2 SOL
  const patient2Keypair = anchor.web3.Keypair.generate(); // 2 SOL
  const patient3Keypair = anchor.web3.Keypair.generate(); // 2 SOL
  const facility_address = anchor.web3.Keypair.generate();
  const multisig_member1 = anchor.web3.Keypair.generate();
  const multisig_member2 = anchor.web3.Keypair.generate();
  const multisig_member3 = anchor.web3.Keypair.generate();
  const multisig_member4 = anchor.web3.Keypair.generate();
  const multisig_member5 = anchor.web3.Keypair.generate();
  const multisig_member6 = anchor.web3.Keypair.generate();
  

const metaplexProgramId = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
  /* Let's write the Airdrop function below */
  async function airdropSol(provider, publicKey, amountSol) {
    const airdropSig = await provider.connection.requestAirdrop(
      publicKey,
      amountSol * anchor.web3.LAMPORTS_PER_SOL
    );

    await provider.connection.confirmTransaction(airdropSig);
  }

  /* Let's set up the actors in our system for airdrop*/

  async function setupActors(provider, users, amount) {
    for (const user of users) {
      await airdropSol(provider, user, amount);
    }

    // Set Up The Token Mints
  
  }

  /* Let's start the actual airdrop*/
  before(async () => {
    // Giving Administrator 5 SOL
    await airdropSol(provider, mediAdmin.publicKey, 5);
    await airdropSol(provider, newAdmin.publicKey, 5);
    // Set up Donors with 10 SOL
    await setupActors(
      provider,
      [
        donor1Keypair.publicKey,
        donor2Keypair.publicKey,
        donor3Keypair.publicKey,
      ],
      10
    );
    // Set up Verifier and Patients with 5 SOL
    await setupActors(
      provider,
      [
        verifier1Keypair.publicKey,
        verifier2Keypair.publicKey,
        verifier3Keypair.publicKey,
        verifier4Keypair.publicKey,
        verifier5Keypair.publicKey,
        verifier6Keypair.publicKey,
        verifier7Keypair.publicKey,
        verifier8Keypair.publicKey,
        verifier9Keypair.publicKey,
        verifier10Keypair.publicKey,
        verifier11Keypair.publicKey,
        patient1Keypair.publicKey,
        patient2Keypair.publicKey,
        patient3Keypair.publicKey,
        multisig_member1.publicKey,
        multisig_member2.publicKey,
        multisig_member3.publicKey,
        multisig_member4.publicKey,
        multisig_member5.publicKey,
        multisig_member6.publicKey,
        mintAuthority.publicKey,
      ],
      5
    );

    collectionMint = Keypair.generate();

    await createMint(
      provider.connection,
      newAdmin,
      newAdmin.publicKey,
      newAdmin.publicKey,
      0,
      collectionMint
    );
      [parentCollectionNftMetadataPDA, ] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        //new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
        metaplexProgramId.toBuffer(),
        collectionMint.publicKey.toBuffer()
      ],
      //new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
      metaplexProgramId
    );

    [parentCollectionMasterEditionPDA, ] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        //new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
        metaplexProgramId.toBuffer(),
        collectionMint.publicKey.toBuffer(),
        Buffer.from("edition")
      ],
      //new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
      metaplexProgramId
    );
  });

  /*  ...........                   ADMIN      
                                  INITIALIZATION        
                                    TEST           
                                                                       ..............*/

  it("TEST 1 ::::: Admin Initialization Done Correctly !!!", async () => {
    // Add your test here.
    // Let's get the Admin PDA
    const [adminPDA, adminBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin"), newAdmin.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .initializeAdministrator(newAdmin.publicKey)
      .accountsPartial({
        initializer: mediAdmin.publicKey,
        // @ts-ignore
        adminAccount: adminPDA,
      })
      .signers([])
      .rpc();

    // Let's make Some Assertions to Ascertain that The new Admin is Really Set
    const adminDetails = await program.account.administrator.fetch(adminPDA);
    expect(adminDetails.adminPubkey.toBuffer()).to.deep.equal(
      newAdmin.publicKey.toBuffer()
    ); // Or you can compare the base58 encoded string instead.
    expect(adminDetails.adminPubkey.equals(newAdmin.publicKey)).to.be.true;
    expect(adminDetails.isActive).to.be.true;
    expect(adminDetails.bump).to.eq(adminBump);
  });

  /*         .......................          INITIALIZING        
                                          VERIFIERS GLOBAL REGISTRY
                                                AND
                                            CASE COUNTER  TEST
                                                                        ................. */
  // LET'S WRITE A TEST TO INITIALIZE THE VERIFIERS GLOBAL REGISTRY AND CASE COUNTER
  it("TEST 2 ::::: Admin Initializing The Global Registry Of Verifiers, Multisig And Case ID Counter for Patients Submissions!!!", async () => {
    //

    const [adminPDA, adminBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin"), newAdmin.publicKey.toBuffer()],
      program.programId
    );

    const [verifiersRegistryPDA, verifiersRegistryBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("verifiers_list")],
        program.programId
      );

    const [multisgPDA, multisigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("multisig"), Buffer.from("escrow-authority")],
      program.programId
    );

    const [caseCounterPDA, caseCounterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_counter")],
      program.programId
    );

    // let's airdrop some sol to the newAdmin
    await airdropSol(provider, newAdmin.publicKey, 2);

    await program.methods
      .initializeGlobalVerifiersListAndCaseCounter()
      .accounts({
        admin: newAdmin.publicKey,
        //@ts-ignore
        adminAccount: adminPDA,
        verifiersList: verifiersRegistryPDA,
        multisig: multisgPDA,
        caseCounter: caseCounterPDA,
      })
      .signers([newAdmin])
      .rpc();

    // Let's Fetch The Global Registry And Make Assertions
    const globalVerifiersListData = await program.account.verifiersList.fetch(
      verifiersRegistryPDA
    );

    expect(globalVerifiersListData.allVerifiers.length).to.equal(0);

    // Let's Fetch The Multisig and Make Assertions
    const multisigData = await program.account.multisig.fetch(
      multisgPDA
    );

    expect(multisigData.multisigAdmin).to.deep.equal(newAdmin.publicKey);
    expect(multisigData.requiredThreshold).to.equal(3);
    expect(multisigData.multisigBump).to.equal(multisigBump);
    expect(multisigData.multisigMembers.length).to.eq(0);

    // Let's Fetch The Global Case Counter and Make Assertions
    const caseCounterData = await program.account.caseCounter.fetch(
      caseCounterPDA
    );
    expect(caseCounterData.currentId.toNumber()).to.equal(0);
    expect(caseCounterData.counterBump).to.equal(caseCounterBump);
  });

  /*         .....................      ADMIN ADDING 
                                      5 TRUSTED  VERIFIERS
                                        TEST
                                                              .....................       */

  it("TEST 3 :::::  Admin Adding 1-5 Verifiers Done Correctly !!!", async () => {
    // Let's initialize admin account here:
    const [adminPDA, adminBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin"), newAdmin.publicKey.toBuffer()],
      program.programId
    );

    // Let's get the Verfier1 PDA address
    const [verifier1PDA, verifier1Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier1Keypair.publicKey.toBuffer()],
      program.programId
    );

    // Let's get the Verifier2 PDA address
    const [verifier2PDA, verifier2Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier2Keypair.publicKey.toBuffer()],
      program.programId
    );

    // Let's get the Verifier3 PDA address
    const [verifier3PDA, verifier3Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier3Keypair.publicKey.toBuffer()],
      program.programId
    );

    // Let's get the Verifier4 PDA address
    const [verifier4PDA, verifier4Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier4Keypair.publicKey.toBuffer()],
      program.programId
    );

    // Let's get the Verifier5 PDA address
    const [verifier5PDA, verifier5Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier5Keypair.publicKey.toBuffer()],
      program.programId
    );

    // Let's get the Verifier6 PDA address
    const [verifier6PDA, verifier6Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier6Keypair.publicKey.toBuffer()],
      program.programId
    );

    // Let's get the Global Registry PDA
    const [verifiersRegistryPDA, verifiersRegistryBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("verifiers_list")],
        program.programId
      );

    // let's airdrop some sol for the newAdmin
    await airdropSol(provider, newAdmin.publicKey, 3);

    // Adding Verifier 1
    await program.methods
      .addOrRemoveVerifier(verifier1Keypair.publicKey, { add: {} })
      .accountsPartial({
        admin: newAdmin.publicKey,
        // @ts-ignore
        adminAccount: adminPDA,
        verifier: verifier1PDA,
        verifiersList: verifiersRegistryPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([newAdmin])
      .rpc();

    // Adding Verifier 2
    await program.methods
      .addOrRemoveVerifier(verifier2Keypair.publicKey, { add: {} })
      .accountsPartial({
        admin: newAdmin.publicKey,
        // @ts-ignore
        adminAccount: adminPDA,
        verifier: verifier2PDA,
        verifiersList: verifiersRegistryPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([newAdmin])
      .rpc();

    //  Adding Verifier 3
    await program.methods
      .addOrRemoveVerifier(verifier3Keypair.publicKey, { add: {} })
      .accountsPartial({
        admin: newAdmin.publicKey,
        // @ts-ignore
        adminAccount: adminPDA,
        verifier: verifier3PDA,
        verifiersList: verifiersRegistryPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([newAdmin])
      .rpc();

    // Adding Verifier 4
    await program.methods
      .addOrRemoveVerifier(verifier4Keypair.publicKey, { add: {} })
      .accountsPartial({
        admin: newAdmin.publicKey,
        // @ts-ignore
        adminAccount: adminPDA,
        verifier: verifier4PDA,
        verifiersList: verifiersRegistryPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([newAdmin])
      .rpc();

    // Adding Verifier 5
    await program.methods
      .addOrRemoveVerifier(verifier5Keypair.publicKey, { add: {} })
      .accountsPartial({
        admin: newAdmin.publicKey,
        // @ts-ignore
        adminAccount: adminPDA,
        verifier: verifier5PDA,
        verifiersList: verifiersRegistryPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([newAdmin])
      .rpc();

    // Adding Verifier 6
    await program.methods
      .addOrRemoveVerifier(verifier6Keypair.publicKey, { add: {} })
      .accountsPartial({
        admin: newAdmin.publicKey,
        // @ts-ignore
        adminAccount: adminPDA,
        verifier: verifier6PDA,
        verifiersList: verifiersRegistryPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([newAdmin])
      .rpc();

    // Asserting Verifier 1 Data Initialized correctly
    const verifier1Details = await program.account.verifier.fetch(verifier1PDA);
    expect(verifier1Details.verifierKey.toBuffer()).deep.equal(
      verifier1Keypair.publicKey.toBuffer()
    );
    expect(verifier1Details.isVerifier).to.be.true;
    expect(verifier1Details.verifierBump).to.eq(verifier1Bump);

    // Asserting Verifier 2 Data Initialized correctly
    const verifier2Details = await program.account.verifier.fetch(verifier2PDA);
    expect(verifier2Details.verifierKey.toBuffer()).deep.equal(
      verifier2Keypair.publicKey.toBuffer()
    );
    expect(verifier2Details.isVerifier).to.be.true;
    expect(verifier2Details.verifierBump).to.eq(verifier2Bump);
    // Asserting Global Verifiers Registry Is Non-zero After Adding Verifier
    const globalVerifiersListData = await program.account.verifiersList.fetch(
      verifiersRegistryPDA
    );
    expect(globalVerifiersListData.allVerifiers.length).to.equal(6);
  });

  /*      ......................      ADMIN REVOKING AND
                                    REMOVING A VERIFIER FROM THE 
                                    GLOBAL REGISTRY OF VERIFIERS             
                                                                              ...............   */

  it("TEST 4 ::::::: Admin Removing Verifier 4 From The Global Registry !!!", async () => {
    // Let's get Verifier 1 PDA address
    const [verifier4PDA, verifier1Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier4Keypair.publicKey.toBuffer()],
      program.programId
    );
    // Let's get Admin PDA address
    const [adminPDA, adminBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin"), newAdmin.publicKey.toBuffer()],
      program.programId
    );
    // Let's get The Global Registry PDA address
    const [verifiersRegistryPDA, verifiersRegistryBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("verifiers_list")],
        program.programId
      );

    // let's airdrip some sol
    await airdropSol(provider, newAdmin.publicKey, 2);

    await program.methods
      .addOrRemoveVerifier(verifier4Keypair.publicKey, { remove: {} })
      .accountsPartial({
        admin: newAdmin.publicKey,
        // @ts-ignore
        adminAccount: adminPDA,
        verifier: verifier4PDA,
        verifiersList: verifiersRegistryPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([newAdmin])
      .rpc();

    // Let's make assertions on Global Registry
    const globalVerifiersListData = await program.account.verifiersList.fetch(
      verifiersRegistryPDA
    );

    expect(globalVerifiersListData.allVerifiers.length).to.equal(5);
  });

  /*        ......................   ONLY ADMIN CAN
                                  ADD OR REMOVE A VERIFIER TO 
                                  OR FROM THE GLOBAL REGISTRY OF VERIFIERS
                                                                               ...................       */

  it("TEST 5 ::::: Unhappy Scenario:  : : Only Admin Can Initialize (Add or Remove) A Verifier !!!!", async () => {
    // Let's set up the Admin and Verifier PDAs
    const [adminPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin"), newAdmin.publicKey.toBuffer()],
      program.programId
    );
    // New Verifier 3 PDA
    const [verifier4PDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier4Keypair.publicKey.toBuffer()],
      program.programId
    );

    // VerifiersList PDA
    const [verifiersRegistryPDA, verifiersRegistryBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("verifiers_list")],
        program.programId
      );

    // We will try to call the addOrRemoveVerifier instruction from a different account
    try {
      // Let's call the initialize verifier instruction
      await program.methods
        .addOrRemoveVerifier(verifier4Keypair.publicKey, { add: {} })
        .accounts({
          admin: patient1Keypair.publicKey,
          // @ts-ignore
          adminAccount: adminPDA,
          verifier: verifier4PDA,
          verifiersList: verifiersRegistryPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([patient1Keypair])
        .rpc();
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("OnlyAdmin");
    }
  });

  it("TEST 30   ::::::::   Admin Initialize The NFT Collection", async () => {

    // 
    
    

    

    // Derive Relevant PDAs
    /*const [metadataPDA, ] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        //new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
        metaplexProgramId.toBuffer(),
        collectionMint.publicKey.toBuffer()
      ],
      //new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
      metaplexProgramId
    );

    const [masterEditionPDA, ] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        //new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
        metaplexProgramId.toBuffer(),
        collectionMint.publicKey.toBuffer(),
        Buffer.from("edition")
      ],
      //new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
      metaplexProgramId
    );*/

    const [multisigPDA, multisigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("multisig"), Buffer.from("escrow-authority")],
      program.programId
    );

    const [adminPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin"), newAdmin.publicKey.toBuffer()],
      program.programId
    );

    const uri = "";

    

    // Let's Mint One NFT token
    const collectionAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      newAdmin,
      collectionMint.publicKey,
      newAdmin.publicKey,
    );

    await mintTo(
      provider.connection,
      newAdmin,
      collectionMint.publicKey,
      collectionAta.address,
      newAdmin.publicKey,
      1,
      [newAdmin]
    );

    await program.methods
      .createNftCollection(uri)
      .accounts({
        admin: newAdmin.publicKey,
        //@ts-ignore
        adminAccount: adminPDA,
        multisig: multisigPDA,
        parentCollectionMint: collectionMint.publicKey,
        parentCollectionNftMetadata: parentCollectionNftMetadataPDA,
        parentCollectionMasterEdition: parentCollectionMasterEditionPDA,
        metadataProgram: metaplexProgramId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .signers([newAdmin])
      .rpc();

    // Some Assertions Later
    
  })

  /*       .........................      PATIENTS CAN
                                    SUBMIT THEIR MEDICAL 
                                      CASES SUCCESSFULLY 
                                                                      ......................     */

  it("TEST 6 :::::: Patient 1 and 2 and 3 Submit First Medical Case !!! ", async () => {
    // We setting up the respective PDAs
    const [patient1CasePDA, patient1CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient1Keypair.publicKey.toBuffer()],
        program.programId
      );
    const [patient2CasePDA, patient2CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient2Keypair.publicKey.toBuffer()],
        program.programId
      );
    const [patient3CasePDA, patient3CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient3Keypair.publicKey.toBuffer()],
        program.programId
      );
    // Case Counter PDA
    const [caseCounterPDA, caseCounterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_counter")],
      program.programId
    );
    const caseCounterDataAll = await program.account.caseCounter.fetch(
      caseCounterPDA
    );
    // Case LookUp PDAs for Patient 1 and 2 and 3
    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0001")],
      program.programId
    );

    const [caseLookupPDA2, caseLookupBump2] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0002")],
      program.programId
    );

    const [caseLookupPDA3, caseLookupBump3] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0003")],
      program.programId
    );

    // Let Patient 1 Call The submit Cases Instruction
    await program.methods
      .submitCases(
        "suffering from Cystic Fibrosis for 2 years now",
        new BN(20000),
        "www.gmail.com/drive/folders/medical_records.pdf"
      )
      .accounts({
        patient: patient1Keypair.publicKey,
        //@ts-ignore
        patientCase: patient1CasePDA,
        caseCounter: caseCounterPDA,
        caseLookup: caseLookupPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([patient1Keypair])
      .rpc();

    // Let Patient 2 Call The Submit Cases Instruction
    await program.methods
      .submitCases(
        "suffering from Ehlers-Danlos Syndrome for a year now",
        new BN(50000),
        "www.github.com/motherfucker/medical_records.pdf"
      )
      .accounts({
        patient: patient2Keypair.publicKey,
        //@ts-ignore
        patientCase: patient2CasePDA,
        caseCounter: caseCounterPDA,
        caseLookup: caseLookupPDA2,
        systemProgram: SystemProgram.programId,
      })
      .signers([patient2Keypair])
      .rpc();

    // Let Patient 3 Call The Submit Cases Instruction
    await program.methods
      .submitCases(
        "suffering from Thyroid dysfunction for a year now",
        new BN(100000),
        "www.gmail.com/drive/folders/hospital_treatment_records.pdf"
      )
      .accounts({
        patient: patient3Keypair.publicKey,
        // @ts-ignore
        patientCase: patient3CasePDA,
        caseCounter: caseCounterPDA,
        caseLookup: caseLookupPDA3,
        systemProgram: SystemProgram.programId,
      })
      .signers([patient3Keypair])
      .rpc();

    // Let's get the Patient 1 & 2 & 3 Cases, And Case Counter
    const patient1CaseData = await program.account.patientCase.fetch(
      patient1CasePDA
    );
    const patient2CaseData = await program.account.patientCase.fetch(
      patient2CasePDA
    );
    const patient3CaseData = await program.account.patientCase.fetch(
      patient3CasePDA
    );

    // Let's Make The Assertions For Patient 1 Here
    expect(patient1CaseData.caseId.toString()).to.eq("CASE0001");
    expect(patient1CaseData.caseDescription.toString()).contains(
      "Cystic Fibrosis"
    );
    expect(patient1CaseData.verificationYesVotes).to.eq(0);
    expect(patient1CaseData.verificationNoVotes).to.eq(0);
    expect(patient1CaseData.isVerified).to.be.false;
    expect(patient1CaseData.splDonations.length).to.eq(0);
    expect(patient1CaseData.votedVerifiers.length).to.eq(0);
    expect(patient1CaseData.totalAmountNeeded.toNumber()).to.eq(20000);
    expect(patient1CaseData.totalSolRaised.toNumber()).to.eq(0);

    // Let's Make Assertions For Patient 2 Here
    expect(patient2CaseData.caseId.toString()).to.eq("CASE0002");
    expect(patient2CaseData.caseDescription.toString()).contains(
      "Ehlers-Danlos Syndrome"
    );
    expect(patient2CaseData.verificationYesVotes).to.eq(0);
    expect(patient2CaseData.verificationNoVotes).to.eq(0);
    expect(patient2CaseData.isVerified).to.be.false;
    expect(patient2CaseData.splDonations.length).to.eq(0);
    expect(patient2CaseData.votedVerifiers.length).to.eq(0);
    expect(patient2CaseData.totalAmountNeeded.toNumber()).to.eq(50000);
    expect(patient2CaseData.totalSolRaised.toNumber()).to.eq(0);

    // Let's Make Assertions For Patient 3 Here
    expect(patient3CaseData.caseId.toString()).to.eq("CASE0003");
    expect(patient3CaseData.caseDescription.toString()).contains(
      "Thyroid dysfunction"
    );
    expect(patient3CaseData.verificationYesVotes).to.eq(0);
    expect(patient3CaseData.verificationNoVotes).to.eq(0);
    expect(patient3CaseData.isVerified).to.be.false;
    expect(patient3CaseData.splDonations.length).to.eq(0);
    expect(patient3CaseData.votedVerifiers.length).to.eq(0);
    expect(patient3CaseData.totalAmountNeeded.toNumber()).to.eq(100000);
    expect(patient3CaseData.totalSolRaised.toNumber()).to.eq(0);
  });

  /*       .....................       VERIFICATION        TESTS
                                        ON A SUBMITTED     CASES
                                                                        ..............     */

  /* ........     VERIFICATION WORKS CORRECTLY FOR A CASE
                                THAT PASSES THE 70% APPROVAL THRESHOLD
                                AND 50% QUORUM OF VERIFIERS    
                                                                        ..........      */

  // Testing for Verification On Patient 1 Case
  it("TEST 7 :::::  4 Verifiers (1, 2, 3, 5) Verify Patient 1 Case: 5 Total Verifiers Initialized, 3 Votes a YES, and 1 a NO !!!", async () => {
    // Testing for verification Purpose
    const [patient1CasePDA, patient1CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient1Keypair.publicKey.toBuffer()],
        program.programId
      );

    const [patient1EscrowPDA, patient1EscrowBump] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from("patient_escrow"),
          Buffer.from("CASE0001"),
          patient1CasePDA.toBuffer(),
        ],
        program.programId
      );

    const [caseCounterPDA, caseCounterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_counter")],
      program.programId
    );

    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0001")],
      program.programId
    );

    const [verifier1PDA, verifier1Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier1Keypair.publicKey.toBuffer()],
      program.programId
    );

    const [verifiersRegistryPDA, verifiersRegistryBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("verifiers_list")],
        program.programId
      );

    // Let Verifier 1 call the approve
    await program.methods
      .verifyPatient("CASE0001", true)
      .accounts({
        verifier: verifier1Keypair.publicKey,
        //@ts-ignore
        patientCase: patient1CasePDA,
        verifierAccount: verifier1PDA,
        caseLookup: caseLookupPDA,
        verifiersList: verifiersRegistryPDA,
        patientEscrow: patient1EscrowPDA,
        caseCounter: caseCounterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([verifier1Keypair])
      .rpc();

    // Let Verifier 2 call the approve
    const [verifier2PDA, verifier2Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier2Keypair.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .verifyPatient("CASE0001", true)
      .accounts({
        verifier: verifier2Keypair.publicKey,
        //@ts-ignore
        patientCase: patient1CasePDA,
        verifierAccount: verifier2PDA,
        caseLookup: caseLookupPDA,
        verifiersList: verifiersRegistryPDA,
        patientEscrow: patient1EscrowPDA,
        caseCounter: caseCounterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([verifier2Keypair])
      .rpc();

    // Let Verifier 3 and 5 call approve
    const [verifier3PDA, verifier3Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier3Keypair.publicKey.toBuffer()],
      program.programId
    );

    const [verifier5PDA, verifier5Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier5Keypair.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .verifyPatient("CASE0001", false)
      .accounts({
        verifier: verifier3Keypair.publicKey,
        //@ts-ignore
        patientCase: patient1CasePDA,
        verifierAccount: verifier3PDA,
        caseLookup: caseLookupPDA,
        verifiersList: verifiersRegistryPDA,
        patientEscrow: patient1EscrowPDA,
        caseCounter: caseCounterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([verifier3Keypair])
      .rpc();

    await program.methods
      .verifyPatient("CASE0001", true)
      .accounts({
        verifier: verifier5Keypair.publicKey,
        //@ts-ignore
        patientCase: patient1CasePDA,
        verifierAccount: verifier5PDA,
        caseLookup: caseLookupPDA,
        verifiersList: verifiersRegistryPDA,
        patientEscrow: patient1EscrowPDA,
        caseCounter: caseCounterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([verifier5Keypair])
      .rpc();
    // Let's get the Patient 1 Case Data
    const Patient1VerificationData = await program.account.patientCase.fetch(
      patient1CasePDA
    );

    // No Votes For Patient 1 Case = 1
    expect(Patient1VerificationData.verificationNoVotes).to.eq(1);

    // Yes Votes For Patient 1 Case = 3
    expect(Patient1VerificationData.verificationYesVotes).to.eq(3);

    // Verification Status is True
    expect(Patient1VerificationData.isVerified).to.be.true;

    // Number of Voted Verifiers
    expect(Patient1VerificationData.votedVerifiers.length).to.eq(4);
  });

  /*      ................          VERIFICATION 70% APPROVAL THRESHOLD WAS NOT REACHED, 
                                      SO CASE 2 REMAINS UNVERIFIED:
                                          THRESOLD WORKING CORRECTLY       
                                                                                                 ...........  */
  // Testing for Verification On Patient 2 Case
  it("TEST 8 ::::::  5 Verifiers (1, 2, 3, 5, 6) On Patient 2 Case: 5 Initialized, 3 Votes a YES, and 2 a NO. 70% threshold working!!!", async () => {
    // Testing For Verification Purposes on Patient 2 Case
    const [patient2CasePDA, patient2CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient2Keypair.publicKey.toBuffer()],
        program.programId
      );

    const [patient2EscrowPDA, patient2EscrowBump] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from("patient_escrow"),
          Buffer.from("CASE0002"),
          patient2CasePDA.toBuffer(),
        ],
        program.programId
      );

    const [caseCounterPDA, caseCounterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_counter")],
      program.programId
    );

    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0002")],
      program.programId
    );

    const [verifier1PDA, verifier1Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier1Keypair.publicKey.toBuffer()],
      program.programId
    );

    const [verifiersRegistryPDA, verifiersRegistryBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("verifiers_list")],
        program.programId
      );

    // Verifier 1 call approve with Yes on Patient 2
    await program.methods
      .verifyPatient("CASE0002", true)
      .accounts({
        verifier: verifier1Keypair.publicKey,
        // @ts-ignore
        patientCase: patient2CasePDA,
        verfifierAccount: verifier1PDA,
        caseLookup: caseLookupPDA,
        verifiersList: verifiersRegistryPDA,
        patientEscrow: patient2EscrowPDA,
        caseCounter: caseCounterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([verifier1Keypair])
      .rpc();

    // Verifier 2 Call Approve With No on Patient Case 2
    const [verifier2PDA, verifier2Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier2Keypair.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .verifyPatient("CASE0002", false)
      .accounts({
        verifier: verifier2Keypair.publicKey,
        // @ts-ignore
        patientCase: patient2CasePDA,
        verfifierAccount: verifier2PDA,
        caseLookup: caseLookupPDA,
        verifiersList: verifiersRegistryPDA,
        patientEscrow: patient2EscrowPDA,
        caseCounter: caseCounterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([verifier2Keypair])
      .rpc();

    // Verifier 3 Call Approve With Yes on Patient Case 2
    const [verifier3PDA, verifier3Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier3Keypair.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .verifyPatient("CASE0002", true)
      .accounts({
        verifier: verifier3Keypair.publicKey,
        // @ts-ignore
        patientCase: patient2CasePDA,
        verifierAccount: verifier3PDA,
        caseLookup: caseLookupPDA,
        verifiersList: verifiersRegistryPDA,
        patientEscrow: patient2EscrowPDA,
        caseCounter: caseCounterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([verifier3Keypair])
      .rpc();

    // Verifier 5 Call Approve With No on Patient Case 2
    const [verifier5PDA, verifier5Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier5Keypair.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .verifyPatient("CASE0002", false)
      .accounts({
        verifier: verifier5Keypair.publicKey,
        // @ts-ignore
        patientCase: patient2CasePDA,
        verifierAccount: verifier5PDA,
        caseLookup: caseLookupPDA,
        verifiersList: verifiersRegistryPDA,
        patientEscrow: patient2EscrowPDA,
        caseCounter: caseCounterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([verifier5Keypair])
      .rpc();

    // Verifier 6 Call Approve With Yes On Patient Case 2
    const [verifier6PDA, verifier6Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier6Keypair.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .verifyPatient("CASE0002", true)
      .accounts({
        verifier: verifier6Keypair.publicKey,
        // @ts-ignore
        patientCase: patient2CasePDA,
        verifierAccount: verifier6PDA,
        caseLookup: caseLookupPDA,
        verifiersList: verifiersRegistryPDA,
        patientEscrow: patient2EscrowPDA,
        caseCounter: caseCounterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([verifier6Keypair])
      .rpc();
    // Let's Get Patient 2 Verification Details data
    const patient2VerificationData = await program.account.patientCase.fetch(
      patient2CasePDA
    );

    // Yes Verification Votes For Patient Case 2 = 3
    expect(patient2VerificationData.verificationYesVotes).to.eq(3);

    // No Verification Votes For Patient Case 2 = 2
    expect(patient2VerificationData.verificationNoVotes).to.eq(2);

    // Verification status for Patient Case 2 is false
    expect(patient2VerificationData.isVerified).to.be.false;
  });

  /*          ........................    VERIFICATION IS REJECTED, 
                                        AS APPROVAL THRESHOLD CLEARLY FAILED
                                        FOR PATIENT CASE 3
                                                                                  .................        */

  it("TEST 9 :::::: 4 Verifiers (2, 3, 5, 6) On Patient 3 Case: 3 Vote a NO, 1 vote a YES. Patient Case Account Is Not Verified", async () => {
    // Let's Get The Patient PDAs
    const [patient3CasePDA, patient3CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient3Keypair.publicKey.toBuffer()],
        program.programId
      );

    const [patient3EscrowPDA, patient3EscrowBump] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from("patient_escrow"),
          Buffer.from("CASE0003"),
          patient3CasePDA.toBuffer(),
        ],
        program.programId
      );

    const [caseCounterPDA, caseCounterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_counter")],
      program.programId
    );

    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0003")],
      program.programId
    );

    const [verifiersRegistryPDA, verifiersRegistryBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("verifiers_list")],
        program.programId
      );

    // Verfier 2 Vote a No on Case 3
    const [verifier2PDA, verifier2Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier2Keypair.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .verifyPatient("CASE0003", false)
      .accounts({
        verifier: verifier2Keypair.publicKey,
        // @ts-ignore
        patientCase: patient3CasePDA,
        verfifierAccount: verifier2PDA,
        caseLookup: caseLookupPDA,
        verifiersList: verifiersRegistryPDA,
        patientEscrow: patient3EscrowPDA,
        caseCounter: caseCounterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([verifier2Keypair])
      .rpc();

    // Verifier 3 Call Approve With Yes on Patient Case 2
    const [verifier3PDA, verifier3Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier3Keypair.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .verifyPatient("CASE0003", false)
      .accounts({
        verifier: verifier3Keypair.publicKey,
        // @ts-ignore
        patientCase: patient3CasePDA,
        verifierAccount: verifier3PDA,
        caseLookup: caseLookupPDA,
        verifiersList: verifiersRegistryPDA,
        patientEscrow: patient3EscrowPDA,
        caseCounter: caseCounterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([verifier3Keypair])
      .rpc();

    // Verifier 5 Call Approve With No on Patient Case 2
    const [verifier5PDA, verifier5Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier5Keypair.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .verifyPatient("CASE0003", false)
      .accounts({
        verifier: verifier5Keypair.publicKey,
        // @ts-ignore
        patientCase: patient3CasePDA,
        verifierAccount: verifier5PDA,
        caseLookup: caseLookupPDA,
        verifiersList: verifiersRegistryPDA,
        patientEscrow: patient3EscrowPDA,
        caseCounter: caseCounterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([verifier5Keypair])
      .rpc();

    // Verifier 6 Call Approve With Yes On Patient Case 2
    const [verifier6PDA, verifier6Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier6Keypair.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .verifyPatient("CASE0003", true)
      .accounts({
        verifier: verifier6Keypair.publicKey,
        // @ts-ignore
        patientCase: patient3CasePDA,
        verifierAccount: verifier6PDA,
        caseLookup: caseLookupPDA,
        verifiersList: verifiersRegistryPDA,
        patientEscrow: patient3EscrowPDA,
        caseCounter: caseCounterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([verifier6Keypair])
      .rpc();

    const patient3CaseData = await program.account.patientCase.fetch(
      patient3CasePDA
    );
    // Yes Verification Votes On Patient Case 3 = 1
    expect(patient3CaseData.verificationYesVotes).to.eq(1);

    // No Verification Votes on Patient Case 3 = 3
    expect(patient3CaseData.verificationNoVotes).to.eq(3);

    // Verification Status For Patient Case 3 is clearly rejected, false
    expect(patient3CaseData.isVerified).to.be.false;
  });

  /*       ..............................        A VERIFIER CANNOT
                                            VOTE TWICE ON A PARTICULAR CASE,
                                                    BUT ONLY ONCE    
                                                                                          .......................    */

  it(" TEST 10 ::::: ===>UNHAPPY SCENARIO::::::::::::::: A Verifier Cannot Vote Twice On A Particular Case", async () => {
    // Verifier 5 Voted On Case 2 In The Prior Test

    const [patient2CasePDA, patient2CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient2Keypair.publicKey.toBuffer()],
        program.programId
      );

    const [patient2EscrowPDA, patient2EscrowBump] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from("patient_escrow"),
          Buffer.from("CASE0002"),
          patient2CasePDA.toBuffer(),
        ],
        program.programId
      );

    const [caseCounterPDA, caseCounterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_counter")],
      program.programId
    );

    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0002")],
      program.programId
    );

    const [verifiersRegistryPDA, verifiersRegistryBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("verifiers_list")],
        program.programId
      );

    const [verifier5PDA, verifier5Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier5Keypair.publicKey.toBuffer()],
      program.programId
    );

    // Let's Ascertain If The Transaction Will Revert If Verifier 5 Attempts to Vote on Case 2 Again
    try {
      await program.methods
        .verifyPatient("CASE0002", true)
        .accounts({
          verifier: verifier5Keypair.publicKey,
          // @ts-ignore
          patientCase: patient2CasePDA,
          verifierAccount: verifier5PDA,
          caseLookup: caseLookupPDA,
          verifiersList: verifiersRegistryPDA,
          patientEscrow: patient2EscrowPDA,
          caseCounter: caseCounterPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([verifier5Keypair])
        .rpc();
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("VerifierAlreadyVoted");
    }
  });

  /*               .................................  A VERIFIER CANNOT
                                                  VOTE ON AN ALREADY VERIFIED CASE
                                                                                        ......................          */

  it("TEST 11 :::::  UNHAPPY SCENARIO:::::::::::::::: A Verifier Cannot Vote On An Already Verified Case  ==> Verifier6 Cannot Vote On Case 1, Which is Already Verified", async () => {
    //Verifier 6 Did Not Vote On Case 1 prior to it being verified.
    // Now, He attempts to Vote on Case 1, but will get a transaction revert.
    const [verifier6PDA, verifier6Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("verifier_role"), verifier6Keypair.publicKey.toBuffer()],
      program.programId
    );

    const [patient1CasePDA, patient1CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient1Keypair.publicKey.toBuffer()],
        program.programId
      );

    const [patient1EscrowPDA, patient1EscrowBump] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from("patient_escrow"),
          Buffer.from("CASE0001"),
          patient1CasePDA.toBuffer(),
        ],
        program.programId
      );

    const [caseCounterPDA, caseCounterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_counter")],
      program.programId
    );

    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0001")],
      program.programId
    );

    const [verifiersRegistryPDA, verifiersRegistryBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("verifiers_list")],
        program.programId
      );

    try {
      await program.methods
        .verifyPatient("CASE0001", true)
        .accounts({
          verifier: verifier6Keypair.publicKey,
          // @ts-ignore
          patientCase: patient1CasePDA,
          verifierAccount: verifier6PDA,
          caseLookup: caseLookupPDA,
          verifiersList: verifiersRegistryPDA,
          patientEscrow: patient1EscrowPDA,
          caseCounter: caseCounterPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([verifier6Keypair])
        .rpc();
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("CaseAlreadyVerified");
    }
  });

  /*           ..........................                DONATIONS TO
                                                        PATIENT CASES  
                                                        TESTINGS
                                                                                ....................   */

  /*   ...................         DONATIONS MADE TO VERIFIED CASE
                                          WORKS CORRECTLY AND SUCCESSFULLY
                                                                                  ................... */
  /// TESTING THAT DONATIONS WORK
  it("TEST 12  =====>>>>> 2 Donors Contributing Funds To A Verified Case I, Works Correctly", async () => {
    // Let's get the various PDAs

    // Create Token Mints
    usdcTokenMint = await createMint(
      provider.connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      6
    );

    // Dai token mint
    daiTokenMint = await createMint(
      provider.connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      9
    );

    ethTokenMint = await createMint(
      provider.connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      18
    );

    

    const [patient1CasePDA, patient1CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient1Keypair.publicKey.toBuffer()],
        program.programId
      );
    const [patient1EscrowPDA, patient1EscrowBump] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from("patient_escrow"),
          Buffer.from("CASE0001"),
          patient1CasePDA.toBuffer(),
        ],
        program.programId
      );

    const [caseCounterPDA, caseCounterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_counter")],
      program.programId
    );
    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0001")],
      program.programId
    );

    const [donor1PDA, donor1Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("donor"), donor1Keypair.publicKey.toBuffer()],
      program.programId
    );
    const [donor2PDA, donor2Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("donor"), donor2Keypair.publicKey.toBuffer()],
      program.programId
    );

    const donor1ATAaddress = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      donor1Keypair,
      usdcTokenMint,
      donor1Keypair.publicKey
    );

    const donor2ATAaddress = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      donor2Keypair,
      daiTokenMint,
      donor2Keypair.publicKey
    );

    const [multisigPDA, multisigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("multisig"), Buffer.from("escrow-authority")],
      program.programId
    );

    const donor1UsdcToken = await mintTo(
      provider.connection,
      mintAuthority,
      usdcTokenMint,
      donor1ATAaddress.address,
      mintAuthority.publicKey,
      2000 * 10 ** 6,
      [mintAuthority]
    );
// Minting Dai Token To Donor 2
    const donor2DaiToken = await mintTo(
      provider.connection,
      mintAuthority,
      daiTokenMint,
      donor2ATAaddress.address,
      mintAuthority.publicKey,
      2000 * 10 ** 9,
      [mintAuthority]
    );

    const [patient1UsdcTokenVaultPDA, patient1UsdcTokenVaultBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("patient_token_vault"), 
        Buffer.from("CASE0001"),
        patient1EscrowPDA.toBuffer(),
        usdcTokenMint.toBuffer()
      ],
      program.programId
    );

    const [patient1DaiTokenVaultPDA, patient1DaiTokenVaultBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("patient_token_vault"), 
        Buffer.from("CASE0001"),
        patient1EscrowPDA.toBuffer(),
        daiTokenMint.toBuffer()
      ],
      program.programId
    );
    


    // Every created PDA account in solana needs a rent-exempt.
    //So, i get the rent exempt for an account with 0 data, which is 890880 lamports
    // This is to get the actual lamports in the escrow PDA account excluding the rent-exempt
    //const rentExempt =
      //await program.provider.connection.getMinimumBalanceForRentExemption(0);

    // Donor 1 Donate Usdc Token
    await program.methods
      .donateToken("CASE0001", usdcTokenMint, new BN(700 * 10 ** 6))
      .accounts({
        donor: donor1Keypair.publicKey,
        // @ts-ignore
        donorAccount: donor1PDA,
        donationToken: usdcTokenMint,
        donorAta: donor1ATAaddress.address,
        caseLookup: caseLookupPDA,
        patientCase: patient1CasePDA,
        patientEscrow: patient1EscrowPDA,
        patientTokenVault: patient1UsdcTokenVaultPDA,
        multisig: multisigPDA,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .signers([donor1Keypair])
      .rpc();

    // Let Donor 2 Contribute DAI Token
    await program.methods
      .donateToken("CASE0001", daiTokenMint, new BN(1000 * 10 ** 9))
      .accounts({
        donor: donor2Keypair.publicKey,
        // @ts-ignore
        donorAccount: donor2PDA,
        donationToken: daiTokenMint,
        donorAta: donor2ATAaddress.address,
        caseLookup: caseLookupPDA,
        patientCase: patient1CasePDA,
        patientEscrow: patient1EscrowPDA,
        patientTokenVault: patient1DaiTokenVaultPDA,
        multisig: multisigPDA,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .signers([donor2Keypair])
      .rpc();

    const donorBalance = await provider.connection.getTokenAccountBalance(donor1ATAaddress.address);
    //console.log("Donor USDC balance:", donorBalance.value.uiAmount);

    // Let's Make Some Assertions
    const patient1UsdcTokenBalance = await provider.connection.getTokenAccountBalance(patient1UsdcTokenVaultPDA);
    console.log("Patient 1 Received USDC of amount:", patient1UsdcTokenBalance.value.uiAmount);
    const patient1DaiTokenBalance = await provider.connection.getTokenAccountBalance(patient1DaiTokenVaultPDA);
    console.log("Patient 1 Received DAI of amount:", patient1DaiTokenBalance.value.uiAmount);

    
    // DONORS CONTRIBUTE NATIVE SOL TO CASE 1
    // Let Donor 1 contribute another 100 To Case I
    await program.methods
      .donateSol("CASE0001", new BN(100))
      .accounts({
        donor: donor1Keypair.publicKey,
        // @ts-ignore
        caseLookup: caseLookupPDA,
        patientCase: patient1CasePDA,
        patientEscrow: patient1EscrowPDA,
        caseCounter: caseCounterPDA,
        donorAccount: donor1PDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([donor1Keypair])
      .rpc();

    const escrowPDAbalance = await program.provider.connection.getBalance(
      patient1EscrowPDA
    );
    console.log("Patient 1 Receives Native SOL of amount: ", escrowPDAbalance);

  });

  it("TEST 20    =========>>>>>>> Minting NFT to Donor", async () => {
    // Minting To Donor Who Has Make A Contribution
    // Let's Get The Relevant PDAs
    const [donor1PDA, donor1Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("donor"), donor1Keypair.publicKey.toBuffer()],
      program.programId
    );

    const [multisigPDA, multisigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("multisig"), Buffer.from("escrow-authority")],
      program.programId
    );

    const [donorNftMintPDA, donorNftMintBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("recognition_nft"), 
        donor1Keypair.publicKey.toBuffer(),
        Buffer.from("CASE0001"),
      ],
      program.programId
    );

    const [donorNftMetadataPDA, ] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        metaplexProgramId.toBuffer(),
        donorNftMintPDA.toBuffer()
      ],
      metaplexProgramId
    );

    const [donorNftMasterEditionPDA, ] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        //new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
        metaplexProgramId.toBuffer(),
        donorNftMintPDA.toBuffer(),
        Buffer.from("edition")
      ],
      //new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
      metaplexProgramId
    );

    const [adminPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin"), newAdmin.publicKey.toBuffer()],
      program.programId
    );


    const donorNftAccount = await getAssociatedTokenAddress(
      donorNftMintPDA,
      donor1Keypair.publicKey
    );

    const nft_uri = "";
    // Call Instruction
    await program.methods
      .mintNft("CASE0001", nft_uri)
      .preInstructions([modifyComputeUnits, addPriorityFee])
      .accounts({
        donor: donor1Keypair.publicKey,
        //@ts-ignore
        donorAccount: donor1PDA,
        multisig: multisigPDA,
        admin: newAdmin.publicKey,
        adminAccount: adminPDA,
        parentRecognitionCollectionNft: collectionMint.publicKey,
        parentCollectionNftMetadata: parentCollectionNftMetadataPDA,
        parentCollectionMasterEdition: parentCollectionMasterEditionPDA,
        donorNftMint: donorNftMintPDA,
        donorNftAccount,
        donorNftMetadata: donorNftMetadataPDA,
        masterEdition: donorNftMasterEditionPDA,
        metadataProgram: metaplexProgramId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .signers([donor1Keypair, newAdmin])
      .rpc();
  })

  /*      .....................                 DONORS ATTEMPT TO 
                                      CONTRIBUTE TO AN UNVERIFIED CASE 2 OR 3
                                              WILL FAIL CERTAINLY
                                                                                      ................  */

  it("TEST 13  ==>>> Donors Attempt To Contribute To An Unverified Case II or III, Must Fail", async () => {
    // Testing For Case II
    const [patient2CasePDA, patient2CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient2Keypair.publicKey.toBuffer()],
        program.programId
      );
    const [patient2EscrowPDA, patient2EscrowBump] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from("patient_escrow"),
          Buffer.from("CASE0002"),
          patient2CasePDA.toBuffer(),
        ],
        program.programId
      );

    const [caseCounterPDA, caseCounterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_counter")],
      program.programId
    );
    const [caseLookupPDA2, caseLookupBump2] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0002")],
      program.programId
    );

    const [donor2PDA, donor1Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("donor"), donor2Keypair.publicKey.toBuffer()],
      program.programId
    );

    // Let Donor 2 contribute 30000 to Unverified Case II
    try {
      await program.methods
        .donateSol("CASE0002", new BN(30000))
        .accounts({
          donor: donor2Keypair.publicKey,
          // @ts-ignore
          caseLookup: caseLookupPDA2,
          patientCase: patient2CasePDA,
          patientEscrow: patient2EscrowPDA,
          caseCounter: caseCounterPDA,
          donorAccount: donor2PDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([donor2Keypair])
        .rpc();
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("UnverifiedCase");
    }
  });



  /*           ----------------------      MULTISIG MEMBER ADDITION
                                                       OR REMOVAL TESTING
                                                                               ---------------------     */
                                                                              
  it("TEST 14    ===>>> Adding And Removing Multisig Members", async () => {
    // Define Relevant PDAs
    const [adminPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin"), newAdmin.publicKey.toBuffer()],
      program.programId
    );
    const [multisigPDA, multisigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("multisig"), Buffer.from("escrow-authority")],
      program.programId
    );

    const multisig_members: PublicKey[] = [
      multisig_member1.publicKey,
      multisig_member2.publicKey,
      multisig_member3.publicKey,
      multisig_member4.publicKey,
      multisig_member5.publicKey,
    ];
    // Let Admin Add Multisig Members
    await program.methods
      .updateMultisig(multisig_members, { addMember :{}})
      .accounts({
        admin: newAdmin.publicKey,
        //@ts-ignore
        adminAccount: adminPDA,
        multisig: multisigPDA,
      })
      .signers([newAdmin])
      .rpc();

      // Let's Make Assertions
      const multisigData = await program.account.multisig.fetch(multisigPDA);
      const members = multisigData.multisigMembers.map(member => member.toBase58());
      expect(multisigData.multisigMembers.length).to.eq(5);
      expect(multisigData.multisigAdmin).deep.eq(newAdmin.publicKey);
      expect(members).to.include(multisig_member1.publicKey.toBase58());
      expect(members).to.include(multisig_member2.publicKey.toBase58());
      expect(members).to.include(multisig_member3.publicKey.toBase58());
      expect(members).to.include(multisig_member4.publicKey.toBase58());
      expect(members).to.include(multisig_member5.publicKey.toBase58());
      

      // Let's Call Removal Instruction
      const removing_addresses: PublicKey[] = [
        multisig_member2.publicKey,
        multisig_member4.publicKey
      ];

      await program.methods
        .updateMultisig(removing_addresses, { removeMember :{}})
        .accounts({
          admin: newAdmin.publicKey,
        //@ts-ignore
          adminAccount: adminPDA,
          multisig: multisigPDA,
        })
        .signers([newAdmin])
        .rpc();

      const multisigDataRemoval = await program.account.multisig.fetch(multisigPDA);
      const membersLeft = multisigDataRemoval.multisigMembers.map(member => member.toBase58());
      expect(multisigDataRemoval.multisigMembers.length).to.eq(3);
      expect(multisigData.multisigAdmin).deep.eq(newAdmin.publicKey);
      expect(membersLeft).to.include(multisig_member1.publicKey.toBase58());
      expect(membersLeft).to.not.include(multisig_member2.publicKey.toBase58());
      expect(membersLeft).to.include(multisig_member3.publicKey.toBase58());
      expect(membersLeft).to.not.include(multisig_member4.publicKey.toBase58());
      expect(membersLeft).to.include(multisig_member5.publicKey.toBase58());

  })


  /*       ---------------------        PROPOSAL CREATIONS AND 
                                          APPROVAL TO RELEASE FUNDS
                                                                              ----------------------------*/

  it("TEST 15    =======>>>>>> Create Proposal To Release Funds", async () => {
    // Get The Relevant PDAs
    const [multisigPDA, multisigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("multisig"), Buffer.from("escrow-authority")],
      program.programId
    );
    const [patient1CasePDA, patient1CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient1Keypair.publicKey.toBuffer()],
        program.programId
      );
    const [patient1EscrowPDA, patient1EscrowBump] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from("patient_escrow"),
          Buffer.from("CASE0001"),
          patient1CasePDA.toBuffer(),
        ],
        program.programId
      );

    const [caseCounterPDA, caseCounterBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_counter")],
      program.programId
    );
    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0001")],
      program.programId
    );
    const [proposalPDA, proposalBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal"),
        Buffer.from("CASE0001"),
        new BN(1).toArrayLike(Buffer,"le", 8)
      ],
      program.programId
    );


    // Let's Call The Actual Instruction
    await program.methods
      .proposeTransfer("CASE0001", new BN(1))
      .accounts({
        proposer: multisig_member1.publicKey,
        //@ts-ignore
        multisig: multisigPDA,
        caseLookup: caseLookupPDA,
        patientCase: patient1CasePDA,
        proposal: proposalPDA,
      })
      .signers([multisig_member1])
      .rpc();

    // Make Assertions
    const proposalData = await program.account.proposal.fetch(proposalPDA);
    expect(proposalData.approved).to.be.false;
    expect(proposalData.proposalIndex.toNumber()).eq(1);
    expect(proposalData.caseId.toString()).eq("CASE0001");
    expect(proposalData.votedMultisig.length).to.eq(1);


    // Allow Multisig Members to Vote On Proposals
    await program.methods
      .approveProposal("CASE0001", new BN(1), true)
      .accounts({
        multisigMember: multisig_member3.publicKey,
        //@ts-ignore
        multisig: multisigPDA,
        caseLookup: caseLookupPDA,
        proposal: proposalPDA
      })
      .signers([multisig_member3])
      .rpc();


    await program.methods
      .approveProposal("CASE0001", new BN(1), true)
      .accounts({
        multisigMember: multisig_member5.publicKey,
        //@ts-ignore
        multisig: multisigPDA,
        caseLookup: caseLookupPDA,
        proposal: proposalPDA
      })
      .signers([multisig_member5])
      .rpc();

    // Assertions For Approval working
    const proposalDataVotes = await program.account.proposal.fetch(proposalPDA);
    expect(proposalDataVotes.approved).to.be.true;
  })

  /*           .......................           RELEASE OF FUNDS 
                                                  TO TREATMENT WALLET 
                                                TESTINGS
                                                                                ...........................  */

  it("TEST 19  ---------- Authorized Multisig Can Release Funds From Escrow To Treatment Wallet", async () => {
    // let's get required pdas
    const [patient1CasePDA, patient1CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient1Keypair.publicKey.toBuffer()],
        program.programId
      );
    const [patient1EscrowPDA, patient1EscrowBump] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from("patient_escrow"),
          Buffer.from("CASE0001"),
          patient1CasePDA.toBuffer(),
        ],
        program.programId
      );
   
    const [adminPDA, adminBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin"), newAdmin.publicKey.toBuffer()],
      program.programId
    );
    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0001")],
      program.programId
    );
    const [proposalPDA, proposalBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal"),
        Buffer.from("CASE0001"),
        new BN(1).toArrayLike(Buffer,"le", 8)
      ],
      program.programId
    );

    const [multisigPDA, multisigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("multisig"), Buffer.from("escrow-authority")],
      program.programId
    );
  
    const patientCaseData = await program.account.patientCase.fetch(patient1CasePDA);
    const remainingAccounts = [];

    for (const eachSplDonations of patientCaseData.splDonations) {
      remainingAccounts.push(
        {pubkey: eachSplDonations.mint, isWritable: false, isSigner: false},
        {pubkey: eachSplDonations.patientTokenVault, isWritable: true, isSigner: false},
      );
      const facilityTokenAta = await getAssociatedTokenAddress(
        eachSplDonations.mint,
        facility_address.publicKey
      );

      remainingAccounts.push(
        {pubkey: facilityTokenAta, isWritable: true, isSigner: false}
      );
      
    }

    // We Assumed the Facility Wallet Has 1 SOL already prior to receiving the donated funds
    // hence the airdrop below

    await airdropSol(provider, facility_address.publicKey, 1);
    
    // Let's call the release_funds instruction
    await program.methods
      .releaseFunds("CASE0001", new BN(1))
      .accounts({
        transferAuthority: multisig_member1.publicKey,
        //@ts-ignore
        patientCase: patient1CasePDA,
        patientEscrow: patient1EscrowPDA,
        caseLookup: caseLookupPDA,
        multisig: multisigPDA,
        proposal: proposalPDA,
        facilityAddress: facility_address.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .remainingAccounts(remainingAccounts)
      .signers([multisig_member1])
      .rpc();

  });
    
  /*          .....................         CLOSING OF REJECTED CASE
                                                  TESTINGS
                                                                                    ..................   */

  it("TEST 16  --------------     ANY USER CAN CLOSE A REJECTED CASE", async () => {
    // Let's get the respective PDAs
    // Pretty Clear Case 3 Was Rejected, as out of 4 Verifiers, 3 rejected and only 1 approved.
    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0003")],
      program.programId
    );
    const [verifiersListPDA, verifiersListBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("verifiers_list")],
        program.programId
      );
    const [patient3CasePDA, patient3CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient3Keypair.publicKey.toBuffer()],
        program.programId
      );

    // Let Patient 2 call that instruction
    await program.methods
      .closeRejectedCase("CASE0003")
      .accounts({
        user: patient2Keypair.publicKey,
        // @ts-ignore
        caseLookup: caseLookupPDA,
        patientCase: patient3CasePDA,
        verifiersList: verifiersListPDA,
      })
      .signers([patient2Keypair])
      .rpc();

    // Now, i will use the getAccountInfo function on the patient3Case pda, and if it's indeed close,
    // solana runtime will return a null
    const patient3CaseCloseData = await provider.connection.getAccountInfo(
      patient3CasePDA
    );
    expect(patient3CaseCloseData).to.eq(null);
  });

  /*     .............................. A VERIFIED CASE CAN NEVER
                                              BE CLOSED
                                                                      ....................     */

  it("TEST 17  ------------      A VERIFIED CASE CAN NOT BE CLOSED, NOT EVEN BY ADMIN", async () => {
    // Pretty Clear Case I is verified. Attempt to close it will produce an error
    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0001")],
      program.programId
    );
    const [verifiersListPDA, verifiersListBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("verifiers_list")],
        program.programId
      );
    const [patient1CasePDA, patient1CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient1Keypair.publicKey.toBuffer()],
        program.programId
      );

    try {
      // Let admin call that instruction
      await program.methods
        .closeRejectedCase("CASE0001")
        .accounts({
          user: newAdmin.publicKey,
          // @ts-ignore
          caseLookup: caseLookupPDA,
          patientCase: patient1CasePDA,
          verifiersList: verifiersListPDA,
        })
        .signers([newAdmin])
        .rpc();
    } catch (err) {
      expect(err.error.errorCode.code).to.eq("CaseAlreadyVerified");
    }
  });

  it("TEST 18   ------------  A CASE THAT HAS NOT ALREADY REACHED THE 70% QUORUM EVEN THOUGH 50% VERIFIERS HAVE VOTED CAN BE CLOSED", async () => {
    // Pretty Clear Case I is verified. Attempt to close it will produce an error
    const [caseLookupPDA, caseLookupBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case_lookup"), Buffer.from("CASE0002")],
      program.programId
    );
    const [verifiersListPDA, verifiersListBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("verifiers_list")],
        program.programId
      );
    const [patient2CasePDA, patient2CaseBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("patient"), patient2Keypair.publicKey.toBuffer()],
        program.programId
      );

    // Let admin call that instruction
    await program.methods
      .closeRejectedCase("CASE0002")
      .accounts({
        user: newAdmin.publicKey,
        // @ts-ignore
        caseLookup: caseLookupPDA,
        patientCase: patient2CasePDA,
        verifiersList: verifiersListPDA,
      })
      .signers([newAdmin])
      .rpc();

    // Now, i will use the getAccountInfo function on the patient2Case pda, and if it's indeed close,
    // solana runtime will return a null
    const patient2CaseCloseData = await provider.connection.getAccountInfo(
      patient2CasePDA
    );
    expect(patient2CaseCloseData).to.eq(null);
  });
});
