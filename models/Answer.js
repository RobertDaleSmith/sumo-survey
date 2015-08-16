/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('answer', { 
    id: {
      field: 'id',
      primaryKey: true,
      type: DataTypes.UUID,
      allowNull: false
    },
    text: {
      field: 'text',
      type: DataTypes.STRING, 
      allowNull: false, 
    },
    order: {
      field: 'order',
      type: DataTypes.INTEGER, 
      allowNull: false, 
    },
    count: {
      field: 'count',
      type: DataTypes.INTEGER, 
      allowNull: false, 
    }
  }, {
    timestamps: true,
    freezeTableName: true,
    underscored: true
  });
};
