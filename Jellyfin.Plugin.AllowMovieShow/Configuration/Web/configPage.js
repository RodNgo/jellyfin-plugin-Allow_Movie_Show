export default function (view) {
    const AllowMovieShowConfig = {
        pluginUniqueId: '4ce5e570-aeba-4218-a0f8-741cd5701ec6',
        selectedHiddenItems: [],
        searchResults: [],

        user: {
            loadUsers: async function () {
                const users = await window.ApiClient.getUsers();
                const selectElement = document.getElementById('userToConfigure');
                selectElement.innerHTML = '';

                for (const user of users) {
                    const option = document.createElement('option');
                    option.value = user.Id;
                    option.textContent = user.Name;
                    selectElement.appendChild(option);
                }
            },
            getSelectedUserId: function () {
                return document.getElementById('userToConfigure').value;
            },
            getSelectedUserName: function () {
                const select = document.getElementById('userToConfigure');
                return select.selectedOptions[0]?.text ?? '';
            }
        },

        init: async function () {
            await this.user.loadUsers();
            await this.loadConfig();

            document.getElementById('userToConfigure').addEventListener('change', this.loadConfig);
            document.getElementById('searchButton').addEventListener('click', this.searchItems);
            document.getElementById('saveButton').addEventListener('click', this.saveConfig);
            document.getElementById('applyNowButton').addEventListener('click', this.applyNow);
        },

        loadConfig: async function () {
            Dashboard.showLoadingMsg();
            try {
                const config = await ApiClient.getPluginConfiguration(AllowMovieShowConfig.pluginUniqueId);
                document.querySelector('#EnablePlugin').checked = config.EnablePlugin;
                const userConfig = config.UserRules.find(x => x.UserId === AllowMovieShowConfig.user.getSelectedUserId());
                const hiddenItemIds = userConfig?.HiddenItemIds || [];

                AllowMovieShowConfig.selectedHiddenItems = await AllowMovieShowConfig.resolveHiddenItems(hiddenItemIds);

                AllowMovieShowConfig.renderSelectedItems();
            } finally {
                Dashboard.hideLoadingMsg();
            }
        },

        searchItems: function (e = null) {
            if (e) {
                e.preventDefault();
            }

            const keyword = document.getElementById('searchKeyword').value;
            if (!keyword || !keyword.trim()) {
                AllowMovieShowConfig.searchResults = [];
                AllowMovieShowConfig.renderSearchResults();
                return;
            }

            Dashboard.showLoadingMsg();
            ApiClient.getItems(AllowMovieShowConfig.user.getSelectedUserId(), {
                SearchTerm: keyword.trim(),
                Recursive: true,
                IncludeItemTypes: 'Movie,Series',
                SortBy: 'SortName',
                SortOrder: 'Ascending',
                Limit: 50
            }).then(function (result) {
                AllowMovieShowConfig.searchResults = result?.Items || [];
                AllowMovieShowConfig.renderSearchResults();
                Dashboard.hideLoadingMsg();
            }).catch(function () {
                Dashboard.hideLoadingMsg();
            });
        },

        renderSearchResults: function () {
            const container = document.getElementById('searchResultsContainer');
            container.innerHTML = '';

            if (AllowMovieShowConfig.searchResults.length === 0) {
                container.innerHTML = '<div class="fieldDescription">No results.</div>';
                return;
            }

            for (const item of AllowMovieShowConfig.searchResults) {
                const isSelected = AllowMovieShowConfig.selectedHiddenItems.some(x => x.Id === item.Id);
                const row = document.createElement('label');
                row.className = 'checkboxContainer';

                row.innerHTML = `
                    <input type="checkbox" is="emby-checkbox" ${isSelected ? 'checked' : ''} data-itemid="${item.Id}" />
                    <span>${item.Name} (${item.Type})</span>
                `;

                row.querySelector('input').addEventListener('change', function (event) {
                    if (event.target.checked) {
                        AllowMovieShowConfig.addSelectedItem(item);
                    } else {
                        AllowMovieShowConfig.removeSelectedItem(item.Id);
                    }
                });

                container.appendChild(row);
            }
        },

        renderSelectedItems: function () {
            const container = document.getElementById('selectedItemsContainer');
            container.innerHTML = '';

            if (AllowMovieShowConfig.selectedHiddenItems.length === 0) {
                container.innerHTML = '<div class="fieldDescription">No hidden items for this user.</div>';
                return;
            }

            for (const item of AllowMovieShowConfig.selectedHiddenItems) {
                const row = document.createElement('div');
                row.style.marginBottom = '0.6em';
                row.innerHTML = `
                    <span>${item.Name} (${item.Type})</span>
                    <button type="button" is="emby-button" class="raised emby-button" style="margin-left: 1em;">Remove</button>
                `;
                row.querySelector('button').addEventListener('click', function () {
                    AllowMovieShowConfig.removeSelectedItem(item.Id);
                    AllowMovieShowConfig.renderSearchResults();
                });
                container.appendChild(row);
            }
        },

        addSelectedItem: function (item) {
            if (AllowMovieShowConfig.selectedHiddenItems.some(x => x.Id === item.Id)) {
                return;
            }

            AllowMovieShowConfig.selectedHiddenItems.push({
                Id: item.Id,
                Name: item.Name,
                Type: item.Type
            });
            AllowMovieShowConfig.renderSelectedItems();
        },

        removeSelectedItem: function (itemId) {
            AllowMovieShowConfig.selectedHiddenItems = AllowMovieShowConfig.selectedHiddenItems.filter(x => x.Id !== itemId);
            AllowMovieShowConfig.renderSelectedItems();
        },

        resolveHiddenItems: async function (itemIds) {
            const normalizedIds = (itemIds || []).filter(x => !!x);
            if (normalizedIds.length === 0) {
                return [];
            }

            const url = new URL('/AllowMovieShowApi/ResolveItems', window.location.origin);
            url.searchParams.set('ids', normalizedIds.join(','));

            try {
                const response = await fetch(url.toString());
                if (!response.ok) {
                    throw new Error('Resolve items request failed');
                }

                const resolvedItems = await response.json();
                const resolvedMap = new Map((resolvedItems || []).map(x => [x.Id, x]));
                return normalizedIds.map(id => {
                    const resolved = resolvedMap.get(id);
                    if (resolved) {
                        return { Id: resolved.Id, Name: resolved.Name, Type: resolved.Type };
                    }

                    return { Id: id, Name: `Unknown item (${id})`, Type: 'Unknown' };
                });
            } catch (error) {
                return normalizedIds.map(id => ({ Id: id, Name: `Unknown item (${id})`, Type: 'Unknown' }));
            }
        },

        saveConfig: function (e = null) {
            if (e) {
                e.preventDefault();
            }

            Dashboard.showLoadingMsg();
            ApiClient.getPluginConfiguration(AllowMovieShowConfig.pluginUniqueId).then(function (config) {
                config.EnablePlugin = document.querySelector('#EnablePlugin').checked;

                const selectedUserId = AllowMovieShowConfig.user.getSelectedUserId();
                const selectedUserName = AllowMovieShowConfig.user.getSelectedUserName();
                const userConfig = config.UserRules.find(x => x.UserId === selectedUserId);
                const hiddenItemIds = AllowMovieShowConfig.selectedHiddenItems.map(x => x.Id);

                if (userConfig) {
                    userConfig.HiddenItemIds = hiddenItemIds;
                } else {
                    config.UserRules.push({
                        UserId: selectedUserId,
                        UserName: selectedUserName,
                        HiddenItemIds: hiddenItemIds
                    });
                }

                ApiClient.updatePluginConfiguration(AllowMovieShowConfig.pluginUniqueId, config)
                    .then(function (result) {
                        Dashboard.processPluginConfigurationUpdateResult(result);
                        return AllowMovieShowConfig.callApplyNow();
                    })
                    .then(function () {
                        Dashboard.alert({
                            title: 'Allow Movie Show',
                            message: 'Saved and applied immediately.'
                        });
                    })
                    .catch(function () {
                        Dashboard.alert({
                            title: 'Allow Movie Show',
                            message: 'Saved configuration, but apply-now failed. You can click Apply now button or restart Jellyfin.'
                        });
                    });
            });
        },

        applyNow: function (e = null) {
            if (e) {
                e.preventDefault();
            }

            AllowMovieShowConfig.callApplyNow()
                .then(function () {
                    Dashboard.alert({
                        title: 'Allow Movie Show',
                        message: 'Rules applied immediately without restart.'
                    });
                })
                .catch(function () {
                    Dashboard.alert({
                        title: 'Allow Movie Show',
                        message: 'Apply now failed. Please check Jellyfin logs.'
                    });
                });
        },

        callApplyNow: async function () {
            const response = await fetch('/AllowMovieShowApi/ApplyNow', {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Apply now failed');
            }
        }
    };

    view.addEventListener('viewshow', async function () {
        await AllowMovieShowConfig.init();
    });
}
