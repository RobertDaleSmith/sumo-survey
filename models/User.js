/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user', { 
    id: {
      field: 'id',
      primaryKey: true,
      type: DataTypes.UUID,
      allowNull: false
    },
    email: {
      field: 'email',
      type: DataTypes.STRING, 
      allowNull: true 
    }
  }, {
    timestamps: true,
    freezeTableName: true,
    underscored: true
  });
};
