const router = require("express").Router();
const services = require("../../../services");
const Application = require("../../../lib/application");
const app = new Application("vs-notify", "api-request-router");
const client = require("../clients");
const cache = require("../../../cache-access");

/**
 * ignoredMessagesTypes array holds list of message types
 * to be ignored from processing.
 */
const ignoredMessageTypes = ["overdue"];

/**
 * This method constructs approbriate message based on the message type and that is
 * the message displayed to the user.
 * @param {object} message the object that holds information received from client
 */
const buildWebNotificationMessage = message => {
  if (message.category === "web-notification") {
    switch (message.type) {
      case "event-remainder":
        return `Event scheduled for ticket #${message.data.ticketNo} on ${message.data.time} and the subject is ${message.data.subject}`;
      case "ticket-assigned":
        return `A new ticket #${message.data.ticketNo} is assigned by ${message.data.fromAgent}`;
      case "ticket-re-assigned":
        return `A new ticket #${message.data.ticketNo} is re-assigned by ${message.data.fromAgent}`;
      case "customer-document-submitted":
        return `The customer submitted '${message.data.docType}' for the ticket #${message.data.ticketNo}`;
      case "customer-missed-call":
        return `The customer tried reaching you from '${message.data.customerNo}' for ticket #${message.data.ticketNo}`;
      case "customer-responded":
        return `The customer have responded on ticket #${message.data.ticketNo}`;
      case "customer-paid":
        return `The customer made payment Rs.${message.data.amount} for ticket #${message.data.ticketNo}`;
      case "agent-responded":
        // this has to send to mobile not to crm via web socket, please discuss with vinoth,
        // and prajil, santhosh and plan for pushing this to mobile
        return `The agent has respondend on the ticket #${message.data.ticketNo}`;
      case "just-in":
        return `The ticket #${message.data.ticketNo} has been moved to Just-In stage`;
      case "quotation-created-at-helpdesk":
        return `Quotation created successfully for the ticket #${message.data.ticketNo}`;
      case "quotation-updated-at-helpdesk":
        return `Quotation updated successfully for the ticket #${message.data.ticketNo}`;
      case "customer-esclated":
        return `Customer has esclated on ticket #${message.data.ticketNo} and the reason is ${message.data.esclatedReason}`;
      case "overdue":
        return `The ticket #${message.data.ticketNo} has marked as overdue for the reason ${message.data.overdueReason}`;
      case "agent-added-note":
        return `${message.data.fromAgent ||
          "An agent"} added notes to the ticket #${message.data.ticketNo}`;
      case "stripe-payment-failed":
        return `The payment failed for the ticket #${message.data.ticketNo}`;
      default:
        return "Unhandled notification category has been received, please ignore and inform engineering team";
    }
  }
};

// const cacheWebNotification = async (key, message) => {
//   let ckey = `${key}##${+new Date()}`
//   message.key = ckey
//   message.unread = true
//   message.message = buildWebNotificationMessage(message)
//   await cache.set(ckey, message, 24 * 60 * 60 * 1000)
//   return message
// }

/**
 * this method returns true if the message to be ignored from processing
 * @param {object} message object which holds information sent by client and includes message
 * type as well
 */
const isThisMessageToBeIgnored = message =>
  ignoredMessageTypes.includes(message.type);

const cacheIncomming = async message => {
  console.log(`incomming-(${message.token})`, JSON.stringify(message));
  if (isThisMessageToBeIgnored(message)) {
    console.log(
      `incomming-(${message.token})`,
      JSON.stringify(message),
      "IGNORED"
    );
  } else {
    let defaultCacheEntry = client.buildCacheEntryTemplate(message.token);
    const userCacheEntryKey = defaultCacheEntry.key;
    delete message.token;
    let userCacheEntry = await cache.get(userCacheEntryKey);

    //if no cache found means he is a new user / first time login in to the system, so build cache block entry for him
    userCacheEntry =
      userCacheEntry === null ? defaultCacheEntry : userCacheEntry;
    if (message.category === "web-notification") {
      // handle web notification
      let ckey = `${userCacheEntryKey}##${+new Date()}`;
      message.key = ckey;
      message.unread = true;
      message.message = buildWebNotificationMessage(message);
      message.time = +new Date();
      await cache.set(ckey, message, 24 * 60 * 60 * 1000);
      userCacheEntry.default.unreadNotifications += 1;
      message.unreadCount = userCacheEntry.default.unreadNotifications;
      await cache.set(userCacheEntryKey, userCacheEntry);
      return message; // this is what will be send to browser
    } else if (
      message.category === "app-notification" &&
      message.type === "init-filter-buckets-count"
    ) {
      // handle app notification
      userCacheEntry.default = Object.assign(
        {},
        userCacheEntry.default,
        message.data
      );
      cache.set(userCacheEntry.key, userCacheEntry); // updating user cache entry
      return Object.assign(message, {
        type: "update-bucket-count",
        data: userCacheEntry.default
      });
    } else if (
      message.category === "app-notification" &&
      message.type === "update-filter-buckets-count"
    ) {
      // handle app notification
      const {
        totalTickets,
        jinTickets,
        crTickets,
        mcallTickets,
        folTickets,
        odTickets,
        notPaidTickets,
        reassignedTickets,
        tmoobjTickets,
        spfailedTickets,
        anotesTickets
      } = userCacheEntry.default;
      // adjust the count
      if (message.data.totalTickets)
        userCacheEntry.default.totalTickets =
          Number(totalTickets) + Number(message.data.totalTickets);
      if (message.data.jinTickets)
        userCacheEntry.default.jinTickets =
          Number(jinTickets) + Number(message.data.jinTickets);
      if (message.data.crTickets)
        userCacheEntry.default.crTickets =
          Number(crTickets) + Number(message.data.crTickets);
      if (message.data.mcallTickets)
        userCacheEntry.default.mcallTickets =
          Number(mcallTickets) + Number(message.data.mcallTickets);
      if (message.data.folTickets)
        userCacheEntry.default.folTickets =
          Number(folTickets) + Number(message.data.folTickets);
      if (message.data.odTickets)
        userCacheEntry.default.odTickets =
          Number(odTickets) + Number(message.data.odTickets);
      if (message.data.notPaidTickets)
        userCacheEntry.default.notPaidTickets =
          Number(notPaidTickets) + Number(message.data.notPaidTickets);
      if (message.data.reassignedTickets)
        userCacheEntry.default.reassignedTickets =
          Number(reassignedTickets) + Number(message.data.reassignedTickets);
      if (message.data.spfailedTickets)
        userCacheEntry.default.spfailedTickets =
          Number(spfailedTickets) + Number(message.data.spfailedTickets);
      if (message.data.anotesTickets)
        userCacheEntry.default.anotesTickets =
          Number(anotesTickets) + Number(message.data.anotesTickets);

      cache.set(userCacheEntry.key, userCacheEntry); // updating user cache entry
      return Object.assign(message, {
        type: "update-bucket-count",
        data: userCacheEntry.default
      });
      // } else if (message.category === 'app-notification'
      // && message.type === 'quoatation-created-at-helpdesk') {
      // return message
    } else {
      return message;
    }
  }
};

/**
 * landing path
 */
router.get("/", (req, res, next) => {
  res.send({ status: "success", server: "vs-notify", version: "1.0" });
});

/**
 * returns notification status
 */
router.get("/status", (req, res, next) => {
  app.info("status resource is requested");
  services
    .getStatus()
    .then(r => {
      const ostr = (r || []).join("\n");
      res.send(`<pre>${ostr}</pre>`);
    })
    .catch(e => {
      res.send(e);
    });
});

/**
 * send a notification
 */
router.post("/ws/message", (req, res, next) => {
  const message = req.body;
  const userEmailId = message.token;
  app.info(message, "a message recieved");
  if (!message) {
    res.status(400).send({ status: "failed", error: "payload empty" });
  } else if (!message.token) {
    res
      .status(400)
      .send({ status: "failed", error: "token attribute required" });
  } else if (!message.category) {
    res
      .status(400)
      .send({ status: "failed", error: "category attribute required" });
  } else if (!message.type) {
    res
      .status(400)
      .send({ status: "failed", error: "type attribute required" });
  } else if (!message.data) {
    res
      .status(400)
      .send({ status: "failed", error: "data attribute required" });
  } else {
    cacheIncomming(message)
      .then(entry => {
        console.log(`push-(${userEmailId})`, JSON.stringify(entry));
        const userSessions = client.sessions[userEmailId] || {};
        const userSessionIds = Object.keys(userSessions);
        if (userSessionIds.length > 0) {
          userSessionIds.forEach((id, i) => {
            userSessions[id].send(JSON.stringify(entry));
            app.debug(`notification sent to session ${i}`, userEmailId);
          });
          res.status(200).send({ status: "ok" });
        } else {
          res
            .status(200)
            .send({ status: "failed", error: "user is not online" });
        }
      })
      .catch(e => {
        app.error(e);
      });
  }
});

const updateUserUnreadNotificationsCount = async (token, value, reset) => {
  const ckey = `crm-usr-${token}`;
  let userCacheEntry = await cache.get(ckey);
  if (userCacheEntry) {
    if (reset) userCacheEntry.default.unreadNotifications = 0;
    else userCacheEntry.default.unreadNotifications += value;
    await cache.set(ckey, userCacheEntry);
  }
};

router.post("/ws/message/ack", (req, res, next) => {
  const message = req.body;
  app.info(message, "web notification ack received");
  if (!message) {
    res.status(400).send({ status: "failed", error: "payload empty" });
  } else if (!message.token) {
    res
      .status(400)
      .send({ status: "failed", error: "token attribute required" });
  } else if (message.key) {
    // mark matched entry as read
    cache
      .get(message.key)
      .then(entry => {
        if (entry) {
          entry.unread = false;
          cache
            .set(message.key, entry)
            .then(() => {
              updateUserUnreadNotificationsCount(message.token, -1);
              app.debug("ack updated");
            })
            .catch(e => {
              app.error("ack update failed", e.toString());
            });
        }
        res.status(200).send({ status: "ok" });
      })
      .catch(e => {
        app.error("ack update failed", `key not found${e.toString()}`);
        res.status(400).send({ status: "failed", error: "ack not updated" });
      });
  } else if (!message.key) {
    // mark all entries as read
    let ckey = `crm-usr-${message.token}##*`; // cache key
    cache.getAll(ckey, true).then(entries => {
      entries.map(entry => {
        entry.unread = false;
        cache.set(entry.key, entry);
      });
      updateUserUnreadNotificationsCount(message.token, 0, true); // all notifications are marked as read
      res.status(200).send(entries);
    });
  }
});
/**
 * send a notification
 */
router.post("/ws/broadcast", (req, res, next) => {
  const message = req.body;
  app.info(message, "new-socket-broadcast-message");
  if (!message) {
    res.status(400).send({ status: "failed", error: "payload empty" });
  } else if (!message.category) {
    res
      .status(400)
      .send({ status: "failed", error: "category attribute required" });
  } else if (!message.type) {
    res
      .status(400)
      .send({ status: "failed", error: "type attribute required" });
  } else if (!message.message) {
    res
      .status(400)
      .send({ status: "failed", error: "message attribute required" });
  } else {
    const msg = JSON.stringify(message);
    client.connections.map(con => {
      con.send(msg);
    });
    res.status(200).send({ status: "ok" });
  }
});

/**
 * send a notification to mobile
 */
router.post("/", (req, res, next) => {
  const message = req.body;
  app.info(message, "new-message");
  services
    .notify(message)
    .then(r => {
      res.send({ status: "success", data: r });
    })
    .catch(e => {
      app.error(e);
      res.status(400).send({ status: "failed", error: e.toString() });
    });
});

/**
 * return notifications
 */

router.get("/history/:userId", (req, res, next) => {
  const userId = req.params["userId"].trim();
  app.info(`notification list requested for ${userId}`);
  if (!userId) {
    return res
      .status(400)
      .send({ status: "failed", error: "user id param is not present" });
  }
  services
    .list(userId)
    .then(notifications => {
      app.info("notification list sent");
      res.send({ status: "success", data: notifications });
    })
    .catch(e => {
      app.error(e);
      res.status(400).send({ status: "failed", error: e.toString() });
    });
});

/**
 * mart as read
 */

router.post("/ack/:notificationId", (req, res, next) => {
  const notificationId = req.params["notificationId"].trim();
  app.info(`notification acknowledged ${notificationId}`);
  if (!notificationId) {
    return res.status(400).send({
      status: "failed",
      error: "notification id param is not present"
    });
  }
  services
    .markAsRead(notificationId)
    .then(r => {
      app.info("notification ack set");
      res.send({ status: "success", data: r });
    })
    .catch(e => {
      app.error(e);
      res.status(400).send({ status: "failed", error: e.toString() });
    });
});

module.exports = router;
