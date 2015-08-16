/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('vote', { 
    id: {
      field: 'id',
      primaryKey: true,
      type: DataTypes.UUID,
      allowNull: false
    },
    q_id: {
      field: 'q_id',
      type: DataTypes.UUID, 
      allowNull: false, 
    },
    a_id: {
      field: 'a_id',
      type: DataTypes.UUID, 
      allowNull: false, 
    }
  }, {
    tableName: 'vote',
    timestamps: true,
    freezeTableName: true,
    underscored: true
  });
};
