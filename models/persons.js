const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const url = process.env.MONGODB_URI;
// console.log("Connecting to URL: ", url)
mongoose
  .connect(url)
  .then((rst) => console.log("Connected to the Mongoose Succesfully"))
  .catch((err) => {
    console.log(url);
    console.log("Connecting Unsuccessfully the problem: ", err.message);
  });

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 3,
    required: true,
  },
  number: {
    type: String,
    validate: {
      validator: function (v) {
        return (/\d{3}-\d/.test(v) || /\d{2}-\d/.test(v)) && v.length >= 8;
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
    required: [true, "User phone number required"],
  },
});

personSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Person", personSchema);
