import Person from "../models/person.model";

export async function createPerson(newPerson) {
  const { id_user, firstname, lastname } = newPerson;
  try {
    let _newPerson = await Person.create(
      { id_user, firstname, lastname },
      { fields: ["id_user", "firstname", "lastname"] }
    );

    if (_newPerson) {
      return { error: false, _newPerson };
    } else {
      return { error: true, _newPerson: null };
    }
  } catch (error) {
    return { error, _newPerson: null };
  }
}

export async function updatePerson(_user) {
  try {
    const { id_user, firstname, lastname } = _user;
    var person = await Person.findOne({ where: { id_user } });

    person.firstname = !firstname ? person.firstname : firstname;
    person.lastname = !lastname ? person.lastname : lastname;

    const _updatePerson = await person.save();

    if (_updatePerson) {
      return { error: false, person: _updatePerson };
    } else {
      return { error: true, person: null };
    }
  } catch (error) {
    return { error, person: null };
  }
}

export async function findByUserId(id_user) {
  try {
    const person = await Person.findOne({ where: { id_user } });
    if (person) {
      return { error: false, person };
    }
    return { error: false, user: null };
  } catch (error) {
    return { error, user: null };
  }
}
