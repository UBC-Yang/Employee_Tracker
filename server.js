const inquirer = require("inquirer");
const { Client } = require("pg");

// Create PostgreSQL Connection
const client = new Client({
    host: "127.0.0.1",
    port: 5432,
    user: "shuyang",
    password: "",
    database: "employeetracker_db"
});

client.connect((err) => {
    if (err) throw err;
    console.log("Connected to database");
    start();
});

// Start function
function start() {
    inquirer
        .prompt({
            type: "list",
            name: "actionChoices",
            message: "What would you like to do? (Use arrow keys)",
            choices: [
                "View All Employees",
                "Add Employee",
                "Update Employee Role",
                "View All Roles",
                "Add Role",
                "View All Departments",
                "Add Department",
                "Quit",
            ],
        })
        .then ((answer) => {
            switch (answer.actionChoices) {
                case "View All Employees":
                    viewAllEmployees();
                    break;
                case "Add Employee":
                    addEmployee();
                    break;
                case "Update Employee Role":
                    updateEmployeeRole();
                    break;
                case "View All Roles":
                    viewAllRoles();
                    break;
                case "Add Role":
                    addRole();
                    break;
                case "View All Departments":
                    viewAllDepartments();
                    break;
                case "Add Department":
                    addDepartment();
                    break;
                case "Quit":
                    client.end();
                    break;
            }
        })
}

// Function to View All Employees
function viewAllEmployees() {
    const query = "SELECT * FROM employee";
    client.query(query, (err, res) => {
        if (err) throw err;
        console.table(res.rows);
        start();
    });
}
// Function to Add Employee
    // What is the employee's first name?
    // What is the employee's last name?
    // What is the employee's role? (Use arrow keys)
    // Who is the employee's manager? (Use arrow keys)
function addEmployee() {
    // connect to database
    client.query("SELECT id, title FROM roles", (error, results) => {
        if (error) {
            console.error(error);
            return;
        }
        const roles = results.rows.map(({id, title}) => ({
            name: title,
            value: id,
        }));

        client.query(
            "SELECT id, CONCAT(first_name, last_name) AS name FROM employee",
            (error, results) => {
                if (error) {
                    console.error(error);
                    return;
                }
                
                const managers = results.rows.map(({id, name}) => ({
                    name,
                    value: id,
                }));

                // prompt user input
                inquirer
                    .prompt([
                        {
                            type: "input",
                            name: "firstName",
                            message: "What is the employee's first name?"
                        },
                        {
                            type: "input",
                            name: "lastName",
                            message: "What is the employee's last name?"
                        },
                        {
                            type: "list",
                            name: "roleID",
                            message: "What is the employee's role? (Use arrow keys)",
                            choices: roles,
                        },
                        {
                            type: "list",
                            name: "managerID",
                            message: "Who is the employee's manager? (Use arrow keys)",
                            choices: [
                                {name: "None", value: null},
                                ...managers,
                            ],
                        },
                    ])
                    .then ((answers) => {
                        console.log(answers)
                        const sql = 
                            "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)";
                        const values = [
                            answers.firstName,
                            answers.lastName,
                            answers.roleID,
                            answers.managerID,
                        ];
                        client.query(sql, values, (error) => {
                            if (error) {
                                console.error(error);
                                return;
                            }
                            console.log("Employee added");
                            start();
                        });
                    })
                    .catch((error) => {
                        console.error(error)
                    });
            }
        );   
    });
}
// Function to Update Employee Role
    // Which employee's role do you want to update? (Use arrow keys)
    // Which role do you want to assign the selected employee? (Use arrow keys)
    // console.log("Updated employee's role")
function updateEmployeeRole() {
    const queryEmployees =
        "SELECT employee.id, employee.first_name, employee.last_name, roles.title FROM employee LEFT JOIN roles ON employee.role_id = roles.id";
    const queryRoles = "SELECT * FROM roles";
    client.query(queryEmployees, (err, resEmployees) => {
        if (err) throw err;
        client.query(queryRoles, (err, resRoles) => {
            if (err) throw err;
            inquirer
                .prompt([
                    {
                        type: "list",
                        name: "employee",
                        message: "Which employee's role do you want to update? (Use arrow keys)",
                        choices: resEmployees.rows.map(
                            (employee) =>
                                `${employee.first_name} ${employee.last_name}`
                        ),
                    },
                    {
                        type: "list",
                        name: "role",
                        message: "Which role do you want to assign the selected employee? (Use arrow keys)",
                        choices: resRoles.rows.map((role) => role.title),
                    },
                ])
                .then((answers) => {
                    const employee = resEmployees.rows.find(
                        (employee) =>
                            `${employee.first_name} ${employee.last_name}` === answers.employee
                    );
                    const role = resRoles.rows.find(
                        (role) => role.title === answers.role
                    );
                    const query = "UPDATE employee SET role_id = $1 WHERE id = $2";
                    client.query(query, [role.id, employee.id], (err, res) => {
                        if (err) throw err;
                        console.log("Updated employee's role");
                        start();
                    });
                });
        });
    });
}
// Function to View All Roles
function viewAllRoles() {
    const query = "SELECT * FROM roles";
    client.query(query, (err, res) => {
        if (err) throw err;
        console.table(res.rows);
        start();
    });
}
// Function to Add Role
    // What is the name of the role?
    // What is the salary of the role?
    // Which department does role belong to? (Use arrow keys)
function addRole() {
    const query = "SELECT * FROM departments";
    client.query(query, (err, res) => {
        if (err) throw err;
        inquirer
            .prompt([
                {
                    type: "input",
                    name: "title",
                    message: "What is the name of the role?",
                },
                {
                    type: "input",
                    name: "salary",
                    message: "What is the salary of the role?",
                },
                {
                    type: "list",
                    name: "department",
                    message: "Which department does role belong to? (Use arrow keys)",
                    choices: res.rows.map(
                        (department) => department.name
                    ),
                },
            ])
            .then ((answers) => {
                const department = res.rows.find (
                    (department) => department.name === answers.department
                );
                const insertQuery = "INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)";
                const values = [answers.title, answers.salary, department.id];

                client.query(insertQuery, values, (err, res) => {
                    if (err) throw err;
                    console.log(`${answers.title} added`);
                    start();
                })
            });
    });
}
// Function to View All Departments
function viewAllDepartments() {
    const query = "SELECT * FROM departments";
    client.query(query, (err, res) => {
        if (err) throw err;
        console.table(res.rows);
        start();
    });
}
// Function to Add Department
    // What is the name of the department?
function addDepartment() {
    inquirer
        .prompt({
            type: "input",
            name: "name",
            message: "What is the name of the department?",
        })
        .then ((answer) => {
            console.log(answer.name);
            const query = ` INSERT INTO departments (name) VALUES ($1)`;
            client.query(query, [answer.name], (err, res) => {
                if (err) throw err;
                console.log(`Added ${answer.name} department to the database`);
                start();
            });
        });
}