const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
});

const Aniversario = sequelize.define("Aniversario", {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dia: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mes: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

async function conectarBanco() {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log("✅ Banco de dados conectado!");
}

module.exports = { sequelize, Aniversario, conectarBanco };