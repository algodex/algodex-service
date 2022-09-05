use crate::get_spreads;
use crate::InitialState;
use crate::StateMachine;

pub fn update_spreads(initial_state: &InitialState, state_machine: &mut StateMachine) {
    let escrow_to_balance = &state_machine.escrow_to_balance;
    let new_spreads = get_spreads(escrow_to_balance, &initial_state.escrow_addr_to_data);
    state_machine.spreads = new_spreads;
}
