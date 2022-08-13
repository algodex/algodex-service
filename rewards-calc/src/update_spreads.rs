use crate::StateMachine;
use crate::InitialState;
use crate::getSpreads;

pub fn updateSpreads(initialState: &InitialState, stateMachine: &mut StateMachine) {
  let escrowToBalance = &stateMachine.escrowToBalance;
  let newSpreads = getSpreads(&escrowToBalance, &initialState.escrowAddrToData);
  stateMachine.spreads = newSpreads;
}
