// "Constants"
// ===================

// Label applied to email by Gmail filter
var Label="Job-Search" 

// Age in days of email to keep
var MaxAge=14; 

// Gmail has a limit on thread batches returned (500, I think).
// Set BatchSize to something less than that. 
var BatchSize=200;

// Email address that would be used to reply to emails. Used
// to keep any threads that I felt was important enough to
// respond to.
var myAddress="tomgehrke@gmail.com";

// Toggle logging. Not sure why one might *not* want to log, but...
var LoggingEnabled=true;
 
// "Functions"
// ===================

// Instantiate the trigger
function Install() {
   ScriptApp.newTrigger("deleteOldMail")
      .timeBased().everyDays(1).create();
}
 
// Remove triggers
function Uninstall() {
   var triggers = ScriptApp.getScriptTriggers();
   var item;
   for each (item in triggers) {
      ScriptApp.deleteTrigger(item);
   }
}
 
// This is the one that does the work
function deleteOldMail() {
  var threads;
  var item;
  var messages;
  var message;
  var deleteOk;
  var searchResultCount=0;
  var threadDeletedCount=0;

  // Creates search string. We are looking for anything with the aforementioned label
  // and older than the aforementioned maximum age, but ignoring threads that have been
  // marked as important.
  var search = "(NOT is:important) label:" + Label + " older_than:" + MaxAge + "d"
  
  if (LoggingEnabled) {console.log("[START] Search of '%s' for threads older than %s days old...", Label, MaxAge.toFixed(0));}
  
  try {
    do {
      // It's OK to delete the thread as far as we know
      deleteOk=true;
      threads=GmailApp.search(search, searchResultCount, BatchSize);
      searchResultCount+=BatchSize;
      
      for each (item in threads) {
        // If the thread contains more than one message, then we *might*
        // have replied to it. We need to dig deeper.
        if (item.getMessageCount()>1){

          // Because our search can't exclude threads that we have replied to, we
          // need to iterate through the thread messages to check that.
          messages=item.getMessages();
          for each (message in messages) {
            // If we sent the message...
            if (message.getFrom()=myAddress){
              if (LoggingEnabled) {console.log("[SKIPPED] %s", item.getFirstMessageSubject());}
              // ...it's not OK to delete the thread.
              deleteOk=false;
              
              //No sense checking anymore so let's get out of here.
              break;
            }
          }
        }
        
        // We're still good to delete the thread.
        if (deleteOk) {
          // Trash it.
          item.moveToTrash();
          // Count it.
          threadDeletedCount+=1;
          // Log it.
          if (LoggingEnabled) {console.log("[DELETE] %s", item.getFirstMessageSubject());}
        }
      }
    } while (threads!=null && threads.length>0);

    if (LoggingEnabled) {console.log("[END] %s threads were deleted!", threadDeletedCount.toFixed(0));}
  } catch(e) {
    console.log("[ERROR] %s", e);
  }
     
}
