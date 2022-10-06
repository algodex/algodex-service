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

pub fn get_seconds_in_epoch() -> u32 {
    604800
}

pub fn get_epoch_start(epoch: u16, epoch_launch_time: u32) -> u32 {
    let start = epoch_launch_time;
    let seconds_in_epoch = get_seconds_in_epoch();
    start + (seconds_in_epoch * ((epoch as u32) - 1))
}

pub fn get_epoch_end(epoch: u16, epoch_launch_time: u32) -> u32 {
    get_epoch_start(epoch, epoch_launch_time) + get_seconds_in_epoch()
}
