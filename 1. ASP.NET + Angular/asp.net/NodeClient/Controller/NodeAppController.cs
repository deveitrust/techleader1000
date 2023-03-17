using System.Net;
using System.Threading.Tasks;
using DT.Messenger.App.MessengerServices.Dto;
using DT.Messenger.Core.NodeServer.Auth;
using DT.Messenger.Intercommunication;
using DT.Messenger.Intercommunication.Authentication.Dto;
using DT.Messenger.Intercommunication.Authentication.Interfaces;
using DT.Messenger.Threading;

namespace DT.Messenger.App.MessengerServices.NodeClient
{
    internal sealed class NodeAppController : INodeAppController
    {
        private readonly INodeApps _nodeApps;
        private readonly IAsyncLocksAccessor _locksAccessor;

        public NodeAppController(
            INodeApps nodeApps,
            IAsyncLocksAccessor locksAccessor
        )
        {
            _nodeApps = nodeApps;
            _locksAccessor = locksAccessor;
        }

        public Task<ResolveNodeOutputDto> GetTargetNodeUrl(long userId)
        {
            return _nodeApps.GetTargetNodeUrl(userId);
        }

        public async Task ConnectNodeAsync(IPAddress nodePublicIpAddress, IConnectNodeRequest request)
        {
            using (await LockAsync(nodePublicIpAddress))
            {
                await _nodeApps.ConnectNodeAsync(nodePublicIpAddress, request);
            }
        }

        public async Task<KeepAliveResult> KeepNodeAliveAsync(IPAddress nodePublicIpAddress)
        {
            using (await LockAsync(nodePublicIpAddress))
            {
                return await _nodeApps.KeepNodeAliveAsync(nodePublicIpAddress);
            }
        }

        public async Task<AuthorizationDto> AuthorizeUserAsync(IPAddress nodePublicIpAddress, int tenantId, long userId)
        {
            using (await LockAsync(nodePublicIpAddress))
            {
                return await _nodeApps.AuthorizeUserAsync(nodePublicIpAddress, tenantId, userId);
            }
        }

        public async Task DisconnectUserAsync(IPAddress nodePublicIpAddress, long userId)
        {
            using (await LockAsync(nodePublicIpAddress))
            {
                await _nodeApps.DisconnectUserAsync(nodePublicIpAddress, userId);
            }
        }

        public Task UpdateAuthData(IMessengerAuthDataInput authData)
        {
            return _nodeApps.UpdateAuthData(authData);
        }

        public Task UpdateLastLoginResult(UpdateLastLoginResultDto lastLoginResultUpdate)
        {
            return _nodeApps.UpdateLastLoginResult(lastLoginResultUpdate);
        }

        public Task<MessengerAuthOutputDto[]> GetLoggedInAuthDatas()
        {
            return _nodeApps.GetLoggedInAuthDatas();
        }

        public Task<MessengerAuthOutputDto> GetAuthData(int authId)
        {
            return _nodeApps.GetAuthData(authId);
        }

        public Task HandleAuthorizationTokenFailed(long userId, string failedBearerToken)
        {
            return _nodeApps.HandleAuthorizationTokenFailed(userId, failedBearerToken);
        }

        private AwaitableDisposable LockAsync(IPAddress ipAddress)
        {
            return _locksAccessor.LockAsync(this, ipAddress);
        }
    }
}
