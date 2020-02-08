/**
 * @intro endpoints composer which collects all api endpoints to be
 * served. Culpa laboris irure exercitation pariatur ipsum dolor excepteur consectetur adipisicing. Nisi ipsum incididunt tempor velit enim sit ea fugiat enim cupidatat ullamco duis fugiat aliqua. Pariatur magna veniam nisi ad nisi Lorem officia exercitation veniam nostrud ipsum. Magna eu ut exercitation amet anim laborum non reprehenderit esse incididunt do incididunt.
 * In qui quis excepteur quis deserunt anim nostrud proident nisi incididunt irure. Laborum quis aliquip magna cillum ut incididunt. Mollit fugiat fugiat magna excepteur dolor aliquip voluptate. Amet dolor occaecat do minim ea sit commodo eu. Cupidatat nisi veniam proident aute ex. Anim nulla enim minim id do mollit laborum irure sint labore. Officia do laborum irure commodo velit Lorem.
 * Amet dolore elit fugiat veniam et irure nostrud ea velit ut. Officia eiusmod labore proident reprehenderit consequat qui. Aliqua cillum irure dolor pariatur non. Incididunt incididunt officia eiusmod dolor duis anim velit veniam dolor elit sit non ut nisi. Dolore aliquip ad adipisicing qui sunt ullamco laborum esse reprehenderit dolor.
 * Nisi cupidatat magna eiusmod eu duis consectetur velit aliquip. Dolor laboris adipisicing mollit pariatur incididunt do eu occaecat officia occaecat reprehenderit. Deserunt elit ullamco ea commodo laboris.
 * Anim et enim enim do cupidatat aliquip mollit anim ea. Minim quis cillum laborum fugiat sit ullamco fugiat officia. Ea ad anim enim tempor culpa. Eu ullamco nisi ex amet eiusmod ex officia sunt officia exercitation proident velit quis. Sint reprehenderit est exercitation magna quis duis magna qui in magna aliquip. Nostrud ut est eiusmod nulla pariatur ipsum ea. Adipisicing ea qui ut fugiat sint.
 * Deserunt nostrud magna aute veniam. Consectetur consequat ex commodo reprehenderit non enim cillum non. Commodo nisi pariatur ullamco minim est dolor adipisicing officia veniam ea laborum id. Incididunt voluptate anim tempor consectetur. Veniam velit nostrud occaecat sit dolore nostrud fugiat ullamco ex voluptate ut laborum consectetur labore.
 * Eu dolor consequat qui nisi adipisicing dolore laborum deserunt sint eiusmod in anim officia. Occaecat eiusmod quis irure sint. Non ex voluptate anim incididunt quis.
 * Eiusmod occaecat qui anim Lorem aute nisi labore do velit fugiat eiusmod culpa. Sunt laborum labore enim cillum ullamco proident id cillum eu do deserunt excepteur culpa. Nulla pariatur ex labore aliqua sit mollit ipsum Lorem non mollit.
 */

const express = require("express");

const router = express.Router();

/**
 * @app message-service Messaging Service API
 * @baseurl http://msg.vakilsearch.com
 * @group sms SMS Endpoints
 * @endpoint /notify
 * @method GET
 * @description sends sms, push notification, web notification, email and others
 */
router.use("/notify", require("./notify"));

module.exports = router;
