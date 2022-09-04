use crate::StateMachine;
use crate::InitialState;
use crate::get_spreads;

pub fn update_spreads(initial_state: &InitialState, state_machine: &mut StateMachine) {
  let escrow_to_balance = &state_machine.escrowToBalance;
  let new_spreads = get_spreads(&escrow_to_balance, &initial_state.escrowAddrToData);
  state_machine.spreads = new_spreads;
}
