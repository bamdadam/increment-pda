

use anchor_lang::prelude::*;

declare_id!("GAkGNP1PCT88mXeC3cmXdi9FUtSNAH3sm5FW9QaxSeNo");

#[program]
pub mod increment_pda {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> Result<()> {
        // require_gt!(10, seeds.len(), CustomErrors::SeedsTooLong);
        ctx.accounts.counter.count = 0;
        ctx.accounts.counter.authority = ctx.accounts.authority.key();
        msg!("successful");
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        require_keys_eq!(counter.authority, ctx.accounts.authority.key());
        counter.count += 1;
        msg!("increment done");
        msg!("{}", counter.count);
        Ok(())
        // todo!()

    }
}

#[derive(Accounts)]
#[instruction(bump:u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init, payer=payer, space = 16 + 32, seeds = [authority.key.as_ref()], bump)]
    pub counter: Account<'info, Counter>,
    pub system_program: Program<'info, System>,
    /// CHECK: safe
    pub authority: UncheckedAccount<'info>

}
#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>
}

#[account]
pub struct Counter {
    count: u64,
    authority: Pubkey
}


#[error_code]
pub enum CustomErrors {
    #[msg("seeds creating the pda are too long")]
    SeedsTooLong
}
