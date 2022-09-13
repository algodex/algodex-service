import { getDatabase } from "./util";

export const serveCouchProxy = async (req, res) => {

  const {database, index, view} = req.params;
  const {keys, group} = req.body.queries[0]

  console.log( {database, index, view, keys, group}); 

  const db = getDatabase(database);
  try {
    const dbResult = await db.query(`${index}/${view}`,
    {
      group, keys
    });
    res.setHeader('Content-Type', 'application/json');
    res.send(dbResult);
  } catch (e) {
    res.send(e);
    return;
  }

};
