import Session from "../models/session.model";

export async function generateSession(newSession) {
  const { id_user, ip, expires, data } = newSession;

  try {
    const _newSession = await Session.create(
      { id_user, ip, expires, data },
      { fields: ["id_user", "ip", "expires", "data"] }
    );

    if (_newSession) {
      return { error: false, _newSession };
    } else {
      return { error: true, _newSession: null };
    }
  } catch (error) {
    return { error, _newSession: null };
  }
}

export async function findSessionById(id) {
  try {
    const session = await Session.findOne({ where: { id } });
    if (session) {
      delete session.dataValues.password;
      return { error: false, session };
    }
    return { error: true, session: null };
  } catch (error) {
    return { error, session: null };
  }
}

export async function updateSession(newSessionData) {
  try {
    const { id, ip, expires, data } = newSessionData;

    var session = await Session.findOne({
      where: { id },
    });

    session.ip = ip ? ip : session.ip;
    session.expires = expires ? expires : session.expires;
    session.data = data ? data : session.data;

    const updateSession = await session.save();

    if (updateSession) {
      return { error: false, session: updateSession };
    } else {
      return { error: true, session: null };
    }
  } catch (error) {
    return { error, session: null };
  }
}
