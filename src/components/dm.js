import React from 'react'
import { useForm } from "react-hook-form"

function Dm(){
  const { register, handleSubmit, errors } = useForm();
  const onSubmit = data => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>
      Fullname:
      <input name="fullname"
        ref={register({ required: true, pattern: /^[a-zA-Z\s]*$/ })}
        placeholder="actual name" />
      {errors.fullname && <span>This field is required</span>}
      </label>
      <br/>
      <label>
      Email:
      <input name="contact"
        ref={register({ required: true })}
        placeholder="way to respond" />
      {errors.contact && <span>This field is required</span>}
      </label>
      <br/>
      <label>
      Message:
      <input name="message"
        ref={register({ required: true, minLength: 5, maxLength: 50 })}
        placeholder="keep it short and sweet" />
      {errors.message && <span>This field is required</span>}
      </label>
       <br/>
      <input type="submit" />
    </form>
  );
}

export default Dm