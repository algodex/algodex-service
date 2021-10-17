FROM algorand/testnet

EXPOSE 8080

ENV ALGORAND_DIR=/root/node
ENV ALGORAND_DATA=$ALGORAND_DIR/data

COPY config.json $ALGORAND_DATA/config.json
COPY entrypoint.sh $ALGORAND_DIR/entrypoint.sh
# Update before starting
RUN $ALGORAND_DIR/update.sh -d $ALGORAND_DATA >$ALGORAND_DIR/update.log

ENTRYPOINT ./entrypoint.sh