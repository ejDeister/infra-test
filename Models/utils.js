export function sqlAll(db, query, params = []) {
  const stmt = db.prepare(query);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

export function sqlGet(db, query, params = []) {
  const stmt = db.prepare(query);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : undefined;
  stmt.free();
  return row
}

export function sqlRun(db, query, params = []) {
  db.run(query, params);
  return {
    changes: db.getRowsModified(),
    lastInsertRowId: db.exec('SELECT last_insert_rowid()')[0].values[0][0]
  };
}
