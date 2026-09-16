self.addEventListener("push", (event) => {
  let data = { title: "C2C", body: "" };
  try {
    if (event.data) data = event.data.json();
  } catch {
    // Malformed payload — fall back to the defaults above.
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "C2C", {
      body: data.body || "",
      icon: "/apple-icon",
      data: { url: data.url || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/dashboard";
  event.waitUntil(self.clients.openWindow(url));
});
