declare module Intercom {
  type timestamp = number

  interface User {
    type?:	string, //	value is ‘user’
    id?:	string, //	The Intercom defined id representing the user
    created_at?:	timestamp, //	The time the user was added to Intercom
    signed_up_at?:	timestamp, //	The time the user signed up
    updated_at?:	timestamp, //	The last time the user was updated
    user_id?:	string, //	The user id you have defined for the user
    email?:	string, //	The email you have defined for the user
    name?:	string, //	The name of the user
    custom_attributes?:	Object, //	The custom attributes you have set on the user (case sensitive).
    last_request_at?:	timestamp, //	The time the user last recorded making a request
    session_count?:	number, //	How many sessions the user has recorded
    avatar?:	{
      type?: string,
      image_url?: string
    }, //	An avatar object for the user
    unsubscribed_from_emails?:	boolean, //	Whether the user is unsubscribed from emails
    user_agent_data?:	string, //	Data about the last user agent the user was seen using
    last_seen_ip?:	string, //	An ip address (e.g. “1.2.3.4”) representing the last ip address the user visited your application from. (Used for updating location_data)
    pseudonym?:	string, //	The pseudonym used if this user was previously a contact
    anonymous?:	boolean, //	Whether or not this is a contact. Always false
    companies?:	{
      type?: string,
      companies?: {
        id: string
      }[]
    }, //	A list of companies for the user
    tags?: {
      type?: string,
      tags: {id?: string}[]
    }, //	A list of tags associated with the user
  }
  module Actions {
    module ViewUser {
      module Request {
        export interface Query {
          user_id?: string
          email?: string
        }
      }
      module Response {
        export type Body = User
      }
    }
  }
}
