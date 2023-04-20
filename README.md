# Download Zoom Recordings

Set of utilities to download Zoom recordings.

## Set up
1. Login to Zoom developer and create App to generate OAuth token to access Zoom account via API. https://marketplace.zoom.us/
2. Follow instructions on Zoom to create application, User level, and will needs to enable all permissions for recordings.
3. Use Postman to generate a OAuth token. https://devforum.zoom.us/t/guide-making-a-zoom-api-call-with-oauth-credentials-in-postman/64538
4.  Run `npm install`
5. In `index.js` update the following:
 * `TOKEN` - paste token generated in Postman
 * `EMAIL` - email of account you are trying to download from
 * `FROM` - month of first recordings to download
 * `TO` - one month later (Zoom only allows you to query in 1 month period)
 * `TODAY` - the current date, used to end function
 6. Uncomment `getAllRecordings` to get all recordings
 7. Uncomment `readRecordingFiles(processFile, 'download') to download