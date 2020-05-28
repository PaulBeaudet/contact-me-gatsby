const relay = require("./relay.js");

const event = {
  body: JSON.stringify({
    text: "just testing to see if this is working"
  })
}

relay.slack( event, null,
  (nullVal, response) => {
    console.log(JSON.stringify(response, null, 4))
    if(response.statusCode !== 200){
      console.log('something went wrong with happy path request')
    }
  }
)