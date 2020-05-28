import React, { useState } from 'react'
import { useForm } from "react-hook-form"

function Dm(){
  let [submited] = useState(false)
  const { register, handleSubmit, errors, reset} = useForm();
  const onSubmit = data => {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({text: data.fullname + " (" + data.contact + "): " + data.message})
    }
    fetch("https://vbc0gawu44.execute-api.us-east-1.amazonaws.com/prod/dm", requestOptions)
      .then(res => {
        if(res.status === 200){
          console.log("thanks for the message")
          reset()
          submited = true
        }
      })
  }
  let view = <form className="basic-grey" onSubmit={handleSubmit(onSubmit)}>
    <h1> Contact Paul
      <span>Would be great to get in touch!</span>
    </h1>
    <label>
    <span>Fullname :</span>
    <input name="fullname"
      ref={register({ required: true, pattern: /^[a-zA-Z\s]*$/ })}
      placeholder="Actual Name" />
    {errors.fullname && <span>This field is required</span>}
    </label>
    <label>
    <span>Email: </span>
    <input name="contact"
      ref={register({ required: true })}
      placeholder="Where to respond" />
    {errors.contact && <span>This field is required</span>}
    </label>
    <label>
    <span>Message: </span>
      <textarea name="message"
      ref={register({ required: true, minLength: 5, maxLength: 180 })}
      placeholder="There is a character limit, we can talk more once we connect" />
    {errors.message && <span>This field is required</span>}
    </label>
    <label>
      <span></span>
      <input type="submit" className="button" value="Send Message"/>
    </label>
  </form>
  if(submited){
    view = <h1>Thanks for sending me a message!</h1>
  }

  return (
    view
  );
}

export default Dm