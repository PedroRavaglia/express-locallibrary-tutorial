const mongoose = require("mongoose");
const { DateTime } = require("luxon");

const AuthorSchema = new mongoose.Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  family_name: { type: String, required: true, maxLength: 100 },
  date_of_birth: Date,
  date_of_death: Date
});

AuthorSchema.virtual("name").get(function () {
  let fullname = "";

  if (this.first_name && this.family_name) {
    fullname = `${this.first_name} ${this.family_name}`
  }
  if (!this.first_name || !this.family_name) {
    fullname = ""
  }

  return fullname;
});

AuthorSchema.virtual("url").get(function () {
  return `/catalog/author/${this._id}`;
});

AuthorSchema.virtual("lifespan").get(function () {
  let lifespan = ' - ';

  if (this.date_of_birth) {
    // lifespan += `${DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED)} - `;
    lifespan = DateTime.fromJSDate(this.date_of_birth).toUTC().toLocaleString(DateTime.DATE_MED) + lifespan;

    if (this.date_of_death) {
      lifespan += DateTime.fromJSDate(this.date_of_death).toUTC().toLocaleString(DateTime.DATE_MED);
    }
  }

  return lifespan;
});

AuthorSchema.virtual("date_of_birth_input").get(function () {
  return DateTime.fromJSDate(this.date_of_birth).toUTC().toFormat('yyyy-MM-dd');
});

AuthorSchema.virtual("date_of_death_input").get(function () {
  return DateTime.fromJSDate(this.date_of_death).toUTC().toFormat('yyyy-MM-dd');
});

module.exports = mongoose.model("Author", AuthorSchema);