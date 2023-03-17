using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Threading.Tasks;
using Castle.Core.Logging;
using DT.Messenger.App.MessengerServices.Dto;
using DT.Messenger.Common.Extensions;
using DT.Messenger.Core.NodeServer.Auth;
using DT.Messenger.Intercommunication;
using DT.Messenger.Intercommunication.Authentication.Dto;
using DT.Messenger.Intercommunication.Authentication.Interfaces;

namespace DT.Messenger.App.MessengerServices.NodeClient
{
    internal sealed class NodeAppFacade : INodeAppFacade
    {
        private readonly INodeAppController _nodeAppController;

        public NodeAppFacade(INodeAppController nodeAppController)
        {
            Logger = NullLogger.Instance;
            _nodeAppController = nodeAppController;
        }

        public ILogger Logger { get; set; }

        public Task<ResolveNodeOutputDto> GetTargetNodeUrl(long userId)
        {
            return _nodeAppController.GetTargetNodeUrl(userId);
        }

        public Task ConnectNodeAsync(IPAddress nodeIpAddress, IConnectNodeRequest request)
        {
            return _nodeAppController.ConnectNodeAsync(nodeIpAddress, request);
        }

        public Task<KeepAliveResult> KeepNodeAliveAsync(IPAddress nodeIpAddress)
        {
            return _nodeAppController.KeepNodeAliveAsync(nodeIpAddress);
        }

        public Task<AuthorizationDto> AuthorizeUserAsync(IPAddress nodeIpAddress, int tenantId, long userId)
        {
            return _nodeAppController.AuthorizeUserAsync(nodeIpAddress, tenantId, userId);
        }

        public Task DisconnectUserAsync(IPAddress nodeIpAddress, long userId)
        {
            return _nodeAppController.DisconnectUserAsync(nodeIpAddress, userId);
        }

        public Task UpdateAuthData(IMessengerAuthDataInput authData)
        {
            return _nodeAppController.UpdateAuthData(authData);
        }

        public Task UpdateLastLoginResult(UpdateLastLoginResultDto lastLoginResultUpdate)
        {
            return _nodeAppController.UpdateLastLoginResult(lastLoginResultUpdate);
        }

        public Task<MessengerAuthOutputDto[]> GetLoggedInAuthDatas()
        {
            return _nodeAppController.GetLoggedInAuthDatas();
        }

        public Task<MessengerAuthOutputDto> GetAuthData(int authId)
        {
            return _nodeAppController.GetAuthData(authId);
        }

        public Task HandleAuthorizationTokenFailed(string failedBearerToken)
        {
            var jwtSecurityTokenHandler = new JwtSecurityTokenHandler();
            var token = jwtSecurityTokenHandler.ReadJwtToken(failedBearerToken);
            var userId = token.Subject.ToLong();
            return _nodeAppController.HandleAuthorizationTokenFailed(userId, failedBearerToken);
        }
    }
}
