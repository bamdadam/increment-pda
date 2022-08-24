import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { getAccount } from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "bn.js";
import { assert, expect } from "chai";
import { IncrementPda } from "../target/types/increment_pda";

async function incremetPlayer(program:anchor.Program<IncrementPda>, counter1Pda: anchor.web3.PublicKey, user_1: anchor.web3.Keypair) {
    await program.methods.increment()
    .accounts({
      counter:counter1Pda,
      authority:user_1.publicKey
    })
    .signers([user_1])
    .rpc();
}

describe("increment-pda", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  const program = anchor.workspace.IncrementPda as Program<IncrementPda>;
  
  let user_1 : Keypair = anchor.web3.Keypair.generate();
  let user_2: Keypair = anchor.web3.Keypair.generate();
  let payer:Keypair = anchor.web3.Keypair.generate();

  it ("send airdrop to payer",async () => {
    const airdropSignature = await provider.connection.requestAirdrop(
      payer.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    const latestBlockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropSignature
    });
    console.log(`payer balance is: ${await provider.connection.getBalance(payer.publicKey)}`);
  })

  let counter1Pda: PublicKey,counter2Pda: PublicKey;
  let counter1Bump: number,counter2Bump: number;
  const seeds1 = user_1.publicKey;
  const seeds2 = user_2.publicKey;
  it("initialize counter 1", async () => {
    [counter1Pda, counter1Bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        seeds1.toBuffer()
      ],
      program.programId,
    );
    console.log("done");
    
    await program.methods.initialize(
      counter1Bump,
    ).accounts({
      payer:payer.publicKey,
      counter: counter1Pda,
      systemProgram:anchor.web3.SystemProgram.programId,
      authority: user_1.publicKey
    }).signers([payer]).rpc();
  });

  it("initialize counter 2", async () => {
    [counter2Pda, counter2Bump] = await PublicKey.findProgramAddress(
      [
        seeds2.toBuffer(),
      ],
      program.programId,
    );
    await program.methods.initialize(
      counter2Bump,
    ).accounts({
      payer:payer.publicKey,
      counter: counter2Pda,
      systemProgram:anchor.web3.SystemProgram.programId,
      authority: user_2.publicKey
    }).signers([payer]).rpc();
  });

  it("increment counters",async () => {
    await incremetPlayer(program, counter1Pda, user_1);
    // await incremetPlayer(program, counter1Pda, user_1);
    // await incremetPlayer(program, counter1Pda, user_1);
    // await incremetPlayer(program, counter2Pda, user_2);
    await incremetPlayer(program, counter2Pda, user_1);
    const counter1Account = await program.account.counter.fetch(counter1Pda);
    const counter2Account = await program.account.counter.fetch(counter2Pda);
    // console.log(counter1Account.count.toNumber());
    // console.log(counter2Account.count.toNumber());
    assert.ok(counter1Account.count.toNumber() == 3);
    assert.ok(counter2Account.count.toNumber() == 1);

  });
});
