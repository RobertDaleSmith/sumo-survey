/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('question', { 
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
    }
  }, {
    timestamps: true,
    freezeTableName: true,
    underscored: true
  });
};
