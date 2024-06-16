import express from 'express';
import pg from 'pg';
import chalk from 'chalk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

//set up server
const app = express();
app.use(express.json());
app.use(cors());

//set up DB
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/HR_Dictionary');

const init = async () => {
  await client.connect();
  const SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
    );
    INSERT INTO departments(name) VALUES('Tech');
    INSERT INTO departments(name) VALUES('HR');
    INSERT INTO departments(name) VALUES('Marketing');


    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER,
        FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    INSERT INTO employees(name, department_id) VALUES('Lulu', 1);
    INSERT INTO employees(name, department_id) VALUES('Mumu', 3);
    INSERT INTO employees(name, department_id) VALUES('Momo', 2);
    `;
  await client.query(SQL);
  console.log(chalk.green('table created && data seeded!!'));

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(chalk.green(`server successfully listening on port ${port}`));
  });
};

init();

//routes

app.get('/api/employees', (req, res) => {
  const SQL = `SELECT e.id, e.name, e.created_at, e.updated_at, d.name as department
  FROM employees e 
  JOIN departments d ON e.department_id = d.id;`;
  client
    .query(SQL)
    .then((response) => {
      res.send(response.rows);
    })
    .catch((error) => console.log(chalk.red(error)));
});

app.get('/api/departments', (req, res) => {
  const SQL = `SELECT * FROM departments;`;
  client
    .query(SQL)
    .then((response) => {
      res.send(response.rows);
    })
    .catch((error) => console.log(chalk.red(error)));
});

app.post('/api/employees', (req, res) => {
  const SQL = `INSERT INTO employees(name, department_id) VALUES('${req.body.name}', ${req.body.department_id}) RETURNING *;`;
  client
    .query(SQL)
    .then((response) => {
      res.send(response.rows);
    })
    .catch((error) => {
      console.log(chalk.red(error));
    });
});

app.delete('/api/employees/:id', (req, res) => {
  const SQL = `DELETE FROM employees WHERE id=${req.params.id} RETURNING *;`;
  client
    .query(SQL)
    .then((response) => {
      if (response.rows.length > 0) {
        res.status(200).json(response.rows);
      } else {
        res.status(404).json({ error: 'Employee not found' });
      }
    })
    .catch((error) => {
      console.log(chalk.red(error));
    });
});

app.put('/api/employees/:id', (req, res) => {
  const SQL = `
    UPDATE employees SET name='${req.body.name}', department_id=${req.body.department_id}, updated_at=now() 
    WHERE id=${req.params.id} RETURNING *; 
    `;
  client
    .query(SQL)
    .then((response) => {
      if (response.rows.length > 0) {
        res.send(response.rows);
      } else {
        res.status(404).json({ error: 'Employee not found' });
      }
    })
    .catch((error) => {
      console.log(chalk.red(error));
    });
});
