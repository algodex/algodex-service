/* 
 * Algodex Service 
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

use crate::get_spreads;
use crate::InitialState;
use crate::StateMachine;

pub fn update_spreads(initial_state: &InitialState, state_machine: &mut StateMachine) {
    let escrow_to_balance = &state_machine.escrow_to_balance;
    let new_spreads = get_spreads(
        escrow_to_balance,
        &initial_state.escrow_addr_to_data,
        &initial_state.hidden_addresses_set,
    );
    state_machine.spreads = new_spreads;
}
