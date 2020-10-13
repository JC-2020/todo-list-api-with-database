'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
   await queryInterface.bulkInsert('Users', [
     {
       email: 'test@test.com',
       password: '$2b$10$RjqEkH5lzl4sqWAJBUXLo.iNpi3HRJPAhUuWddcjaQDzhZ52m4ZYe',
       createdAt: new Date(),
       updatedAt: new Date()
     }
   ])
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

  }
};
