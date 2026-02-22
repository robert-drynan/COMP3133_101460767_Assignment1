const { gql } = require('apollo-server-express');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
const Employee = require('../models/Employee');

// Cloudinary setup for the employee photos
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Type Definitions 
const typeDefs = gql`
  type User {
    _id: ID!
    username: String!
    email: String!
    created_at: String
    updated_at: String
  }

  type AuthPayload {
    token: String
    user: User!
  }

  type Employee {
    _id: ID!
    first_name: String!
    last_name: String!
    email: String!
    gender: String!
    designation: String!
    salary: Float!
    date_of_joining: String!
    department: String!
    employee_photo: String
    created_at: String
    updated_at: String
  }

  type DeleteResponse {
    success: Boolean!
    message: String!
  }

  type Query {
    login(username_or_email: String!, password: String!): AuthPayload!
    getAllEmployees: [Employee!]!
    searchEmployeeById(eid: ID!): Employee
    searchEmployeeByDesignationOrDepartment(designation: String, department: String): [Employee!]!
  }

  type Mutation {
    signup(username: String!, email: String!, password: String!): User!
    addEmployee(
      first_name: String!
      last_name: String!
      email: String!
      gender: String!
      designation: String!
      salary: Float!
      date_of_joining: String!
      department: String!
      employee_photo: String
    ): Employee!
    updateEmployee(
      eid: ID!
      first_name: String
      last_name: String
      email: String
      gender: String
      designation: String
      salary: Float
      date_of_joining: String
      department: String
      employee_photo: String
    ): Employee!
    deleteEmployee(eid: ID!): DeleteResponse!
  }
`;
const resolvers = {
  Query: {
    // user Login
    login: async (_, { username_or_email, password }) => {
      const user = await User.findOne({
        $or: [{ username: username_or_email }, { email: username_or_email }],
      });
      if (!user) throw new Error('User not found');

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error('Incorrect password');

      return { token: null, user };
    },
    // Get all the employees
    getAllEmployees: async () => {
      return await Employee.find();
    },

    // Search employees by their ID
    searchEmployeeById: async (_, { eid }) => {
      const employee = await Employee.findById(eid);
      if (!employee) throw new Error('Employee not found');
      return employee;
    },

    // Search for employees by designation or department
    searchEmployeeByDesignationOrDepartment: async (_, { designation, department }) => {
      if (!designation && !department) {
        throw new Error('Provide at least designation or department');
      }
      const query = {};
      if (designation) query.designation = { $regex: designation, $options: 'i' };
      if (department)  query.department  = { $regex: department,  $options: 'i' };
      return await Employee.find({ $or: Object.entries(query).map(([k, v]) => ({ [k]: v })) });
    },
  },

  Mutation: {
    // user Signup
    signup: async (_, { username, email, password }) => {
      const exists = await User.findOne({ $or: [{ username }, { email }] });
      if (exists) throw new Error('Username or email already in use');
      const user = new User({ username, email, password });
      return await user.save();
    },

    // Add an employee
    addEmployee: async (_, args) => {
      const { employee_photo, ...rest } = args;
//allows for a photo to be added
      let photoUrl = null;
      if (employee_photo) {
        const result = await cloudinary.uploader.upload(employee_photo, {
          folder: 'employee_photos',
        });
        photoUrl = result.secure_url;
      }

      const employee = new Employee({
        ...rest,
        date_of_joining: new Date(rest.date_of_joining),
        employee_photo: photoUrl,
      });
      return await employee.save();
    },

    // Update employee
    updateEmployee: async (_, { eid, ...updates }) => {
      if (updates.date_of_joining) {
        updates.date_of_joining = new Date(updates.date_of_joining);
      }

      if (updates.employee_photo) {
        const result = await cloudinary.uploader.upload(updates.employee_photo, {
          folder: 'employee_photos',
        });
        updates.employee_photo = result.secure_url;
      }

      const employee = await Employee.findByIdAndUpdate(
        eid,
        { $set: updates },
        { new: true, runValidators: true }
      );
      if (!employee) throw new Error('Employee not found');
      return employee;
    },

    // Delete employee
    deleteEmployee: async (_, { eid }) => {
      const employee = await Employee.findByIdAndDelete(eid);
      if (!employee) throw new Error('Employee not found');
      return { success: true, message: 'Employee deleted successfully' };
    },
  },
};

module.exports = { typeDefs, resolvers };