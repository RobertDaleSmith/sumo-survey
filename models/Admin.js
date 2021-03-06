/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('admin', { 
    username: {
      field: 'username',
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true
    },
    password: {
      field: 'password',
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true
    }
  }, {
    timestamps: true,
    freezeTableName: true,
    underscored: true
  });
};
