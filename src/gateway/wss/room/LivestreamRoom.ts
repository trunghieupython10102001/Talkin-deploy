import { UnauthorizedException } from '@nestjs/common';
import { IPeer } from '../wss.interfaces';
import Room from './Room';
import { rpcMethod } from './helper';
import { LivestreamRoomStatus } from 'src/common/constants/livestream-room.enum';

interface RoomState {
  id: string;
  numberOfViewers?: number;
  status?: LivestreamRoomStatus;
  thumbnail?: string;
}

class LivestreamRoom extends Room {
  private streamer: IPeer;

  // 'coming' is initial status
  private status = LivestreamRoomStatus.COMING_SOON;

  @rpcMethod
  protected async join(payload: any) {
    const { peerId, data } = payload;
    const { device, rtpCapabilities, sctpCapabilities, isStreamer } = data;

    const peer = this.peers.get(peerId);
    if (!peer) {
      console.log('join livestream room ERROR: PEER NOT FOUND');
      return;
    }

    // TODO: verify streamer in backend
    try {
      peer.isWaiting = false;
      peer.data = {
        ...peer.data,
        device,
        rtpCapabilities,
        sctpCapabilities,
      };
      if (isStreamer) this.setupStreamer(peer);
      else this.handleNewPeer(peer);

      return {
        peers: this.peersCount,
        status: this.status,
        streamer: {
          displayName: this.streamer?.peerInfo?.displayName,
          avatarUrl: this.streamer?.peerInfo?.avatarUrl,
          description: this.streamer?.peerInfo?.description,
        },
      };
    } catch (error) {
      console.log('join livestream room ERROR: ', error);
      peer.isWaiting = true;
      return;
    }
  }

  @rpcMethod
  private async stopLivestream(payload: any) {
    const { peerId } = payload;
    if (peerId !== this.streamer?.id) return 'Only streamer can stop stream.';
    this.status = LivestreamRoomStatus.END;
    this.streamer = null;
    this.handleLeavePeer(peerId);

    await this.prismaService.livestreamRoom.update({
      where: { id: this.id },
      data: { status: LivestreamRoomStatus.END.toString() },
    });

    // broadcast notification to all peers
    this.broadcast('notification', {
      method: 'endstream',
      data: {},
    });
    return 'The livestream has ended!';
  }

  @rpcMethod
  protected async createWebRtcTransport(payload: any): Promise<any> {
    const { peerId, data } = payload;
    const { producing } = data;
    const peer = this.getPeer(peerId);
    if (producing) {
      if (this.streamer || !peer?.peerInfo?.isHost)
        return 'Only streamer can create stream.';
      if (
        this.status === LivestreamRoomStatus.LIVE ||
        this.status === LivestreamRoomStatus.END
      )
        return 'The stream has already activated or ended!';
    }

    return super.createWebRtcTransport(payload);
  }

  @rpcMethod
  protected async produce(payload: any): Promise<any> {
    const producerData = await super.produce(payload);
    return producerData;
  }

  private async setupStreamer(peer: IPeer) {
    if (
      !peer.peerInfo.isHost ||
      this.streamer?.id ||
      this.status !== LivestreamRoomStatus.COMING_SOON
    )
      throw new UnauthorizedException();
    this.streamer = peer;
    this.streamer.io.join(this.id);
    this.status = LivestreamRoomStatus.LIVE;
    await this.prismaService.livestreamRoom.update({
      where: { id: this.id },
      data: {
        status: LivestreamRoomStatus.LIVE.toString(),
        realStartTime: new Date(),
      },
    });
    this.broadcastRoomState();

    this.streamer.io.on('disconnect', () =>
      this.stopLivestream({ peerId: peer.id }),
    );
  }

  broadcastRoomState() {
    const payload: RoomState = {
      id: this.id,
      numberOfViewers: this.peersCount,
      status: this.status,
    };

    // broadcast to all clients are inside room
    this.broadcast('notification', {
      method: 'roomStatusUpdated',
      data: payload,
    });

    // broadcast to all clients are listening to status of room (i.e: homepage)
    this.wssServer
      .to(`RoomStatus_${this.id}`)
      .emit('roomStatusUpdated', payload);
  }

  override handleNewPeer(peer: IPeer) {
    super.handleNewPeer(peer);

    // if there is a streamer in room already
    // create new consumer for the new comer
    if (this.status == LivestreamRoomStatus.END)
      throw new Error('Livestream Room has ended!');
    if (this.streamer) {
      for (const producer of Array.from(
        this.streamer.data.producers.values(),
      )) {
        this.createConsumer({
          consumerPeer: peer,
          producerPeer: this.streamer,
          producer,
        });
      }
    }

    this.broadcastRoomState();
  }

  /**
   * Remove peer from the room
   * broadcast the viewerStatus to all listeners
   */
  override handleLeavePeer(peerId: string): void {
    this.removePeer(peerId);
    this.broadcastRoomState();
  }

  override get peersCount(): number {
    let joinPeerNumber = Array.from(this.peers.values()).filter(
      (x) => !x.isWaiting,
    )?.length;
    if (!joinPeerNumber) return 0;
    if (this.streamer) joinPeerNumber--;
    return joinPeerNumber;
  }

  @rpcMethod
  override chat(payload: any) {
    const { peerId, data } = payload;
    const { content } = data;
    const sentAt = new Date();

    const peer = this.peers.get(peerId);

    // TODO: write a function to check authenticated peer
    if (!peer || !peer.peerInfo?.userId)
      return { done: false, error: 'Login required!' };

    peer.io.to(this.id).emit('notification', {
      method: 'chat',
      data: {
        peerId,
        displayName: peer.peerInfo.displayName,
        avatarUrl: peer.peerInfo.avatarUrl,
        content,
        sentAt,
      },
    });
    return { done: true };
  }
}

export default LivestreamRoom;
