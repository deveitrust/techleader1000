using Abp.Dependency;

namespace DT.Messenger.App.MessengerServices.NodeClient
{
    internal interface INodeApps : ISingletonDependency, INodeAppsBase
    {
    }
}