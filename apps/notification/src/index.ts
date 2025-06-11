import "@/bootstrap";
import "@/teardown";
import { consumer } from "./broker/consumer";
import { Notification } from "@sd/contracts";

async function main() {
  await consumer.subscribe({
    topic: "notification",
    fromBeginning: true,
  });

  consumer.run({
    eachMessage: async ({ message: _message }) => {
      if (_message.value) {
        const { id, message }: Notification = JSON.parse(
          _message.value.toString()
        );

        console.log({
          id,
          message,
        });
      }
    },
  });
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
