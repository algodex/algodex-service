import { getDatabase } from "./util";

// curl -d '{"message":"a log message", "severity":"error", "unixTime":132133}' -H "Content-Type: application/json" -X POST http://localhost:3006/debug/log/post
export const logRemote = async (req, res) => {
  console.log('Got body:', req.body);
  const db = getDatabase('logging');

  const saveRewardsReqData = <LogMessage>(req.body);
  await db.post(saveRewardsReqData);
  res.sendStatus(200);
};
