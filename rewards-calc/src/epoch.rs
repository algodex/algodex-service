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
