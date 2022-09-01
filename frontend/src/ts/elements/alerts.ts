import formatDistanceToNowStrict from "date-fns/formatDistanceToNowStrict";
import Ape from "../ape";
import { Auth } from "../firebase";

export function hide(): void {
  if (!$("#alertsPopupWrapper").hasClass("hidden")) {
    setBellButtonColored(false);
    $("#alertsPopup").animate(
      {
        marginRight: "-10rem",
      },
      100,
      "easeInCubic"
    );
    $("#alertsPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#alertsPopupWrapper").addClass("hidden");
        }
      );
  }
}

export async function show(): Promise<void> {
  if ($("#alertsPopupWrapper").hasClass("hidden")) {
    $("#alertsPopup").css("marginRight", "-10rem").animate(
      {
        marginRight: 0,
      },
      100,
      "easeOutCubic"
    );

    if (Auth.currentUser) {
      $("#alertsPopup .accountAlerts").removeClass("hidden");
      $("#alertsPopup .accountAlerts .list").html(`
        <div class="preloader"><i class="fas fa-fw fa-spin fa-circle-notch"></i></div>`);
    } else {
      $("#alertsPopup .accountAlerts").addClass("hidden");
    }

    $("#alertsPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate(
        {
          opacity: 1,
        },
        100,
        () => {
          if (Auth.currentUser) {
            getAccountAlerts();
          }
        }
      );
  }
}

async function getAccountAlerts(): Promise<void> {
  const inboxResponse = await Ape.users.getInbox();

  $("#alertsPopup .accountAlerts .list").empty();

  if (inboxResponse.status !== 200) {
    // addNotification(, -1);
    $("#alertsPopup .accountAlerts .list").html(
      `
      <div class="nothing">
      Error getting inbox: ${inboxResponse.message}
      </div>
      `
    );
    return;
  }
  const inboxData = inboxResponse.data as {
    inbox: MonkeyTypes.MonkeyMail[];
    maxMail: number;
  };

  if (inboxData.inbox.length === 0) {
    $("#alertsPopup .accountAlerts .list").html(`
    <div class="nothing">
    Nothing to show
    </div>
    `);
    return;
  }

  $("#alertsPopup .accountAlerts .title .right").text(
    `${inboxData.inbox.length}/${inboxData.maxMail}`
  );

  const markAsRead = [];

  for (const ie of inboxData.inbox) {
    if (!ie.read && ie.rewards.length == 0) {
      markAsRead.push(ie.id);
    }

    let rewardsString = "";

    if (ie.rewards.length > 0) {
      rewardsString = `<div class="rewards">
        <i class="fas fa-fw fa-gift"></i>
        <span>${ie.rewards.length}</span>
      </div>`;
    }

    $("#alertsPopup .accountAlerts .list").append(`
    
      <div class="item" data-id="${ie.id}">
        <div class="indicator ${ie.read ? "" : "main"}"></div>
        <div class="timestamp">${formatDistanceToNowStrict(
          new Date(ie.timestamp)
        )} ago</div>
        <div class="title">${ie.subject}</div>
        <div class="body">
          ${ie.body}\n\n${rewardsString}
        </div>
        <div class="buttons">
          ${
            ie.rewards.length > 0
              ? `<div class="textButton" aria-label="Claim" data-balloon-pos="left"><i class="fas fa-gift"></i></div>`
              : ``
          }
          <div class="textButton" aria-label="Delete" data-balloon-pos="left"><i class="fas fa-trash"></i></div>
        </div>
      </div>
    
    `);
  }

  if (markAsRead.length > 0) {
    Ape.users.updateInbox({
      mailIdsToMarkRead: markAsRead,
    });
  }
}

export function addPSA(message: string, level: number): void {
  if ($("#alertsPopup .psas .list .nothing").length > 0) {
    $("#alertsPopup .psas .list").empty();
  }

  let levelClass = "";
  if (level === -1) {
    levelClass = "error";
  } else if (level === 1) {
    levelClass = "main";
  } else if (level === 0) {
    levelClass = "sub";
  }
  $("#alertsPopup .psas .list").prepend(`
    <div class="item">
    <div class="indicator ${levelClass}"></div>
    <div class="body">
      ${message}
    </div>
  </div>
  `);
}

export function addNotification(
  message: string,
  level: number,
  customTitle?: string
): void {
  if ($("#alertsPopup .notificationHistory .list .nothing").length > 0) {
    $("#alertsPopup .notificationHistory .list").empty();
  }

  let title = "Notice";
  let levelClass = "sub";
  if (level === -1) {
    levelClass = "error";
    title = "Error";
  } else if (level === 1) {
    levelClass = "main";
    title = "Success";
  }

  if (customTitle) {
    title = customTitle;
  }

  $("#alertsPopup .notificationHistory .list").prepend(`
    <div class="item">
    <div class="indicator ${levelClass}"></div>
    <div class="title">${title}</div>
    <div class="body">
      ${message}
    </div>
  </div>
  `);
}

export function setBellButtonColored(tf: boolean): void {
  if (tf) {
    $("#top #menu .showAlerts").addClass("active");
  } else {
    $("#top #menu .showAlerts").removeClass("active");
  }
}

$("#top #menu .showAlerts").on("click", () => {
  show();
});

$("#alertsPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "alertsPopupWrapper") {
    hide();
  }
});

$(document).on("keydown", (e) => {
  if (e.key === "Escape" && !$("#alertsPopupWrapper").hasClass("hidden")) {
    hide();
  }
});
